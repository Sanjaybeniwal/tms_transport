const express = require('express');
const { sequelize } = require('../config/database');
const M = require('../models');
const { TripAccount, AccountingAudit } = require('./models');
const S = require('./service');
const V = require('./validation');
const R = require('./reports');
const { money: m, cents: c, sum } = require('./money');
const router = express.Router();
for (const name of ['id', 'transactionId', 'expenseId']) router.param(name, (req, res, next, value) => {
  if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) return next(new (require('../utils/appError'))('A valid numeric record ID is required', 400));
  next();
});
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
const ok = (res, data) => res.json({ status: 'success', data });
const query = req => { const q = V.validate(V.query, req.query); if (q.startDate && q.endDate && q.startDate > q.endDate) S.fail('Start date must not exceed end date'); return q; };
router.get('/masters', wrap(async (req, res) => {
  const options = { order: [['id', 'ASC']] };
  ok(res, { vehicles: await M.Vehicle.findAll(options), owners: await M.Owner.findAll(options), companies: await M.Party.findAll(options), trips: await M.Trip.findAll(options), expenseHeads: await M.ExpenseHead.findAll(options) });
}));
router.put('/vehicles/:id/classification', wrap(async (req, res) => {
  if (!['Super Admin', 'Admin', 'Manager'].includes(req.user.role)) S.fail('Only managers may classify vehicles', 403);
  if (!['Own', 'Market'].includes(req.body.classification)) S.fail('Select Own or Market');
  const data = await sequelize.transaction(async transaction => {
    const v = await M.Vehicle.findByPk(req.params.id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!v) S.fail('Vehicle not found', 404);
    if (await TripAccount.count({ include: [{ model: M.Trip, as: 'trip', where: { vehicleId: v.id } }], transaction })) S.fail('Cannot reclassify a vehicle with enrolled accounting history');
    const before = v.toJSON();
    await v.update({ classification: req.body.classification }, { transaction });
    await S.audit('Vehicle', v.id, 'classify', before, v.toJSON(), req.user, transaction); return v;
  });
  ok(res, data);
}));
router.post('/vehicles/:id/expenses', wrap(async (req, res) => {
  const body = V.validate(V.posting, { ...req.body, kind: 'expense' });
  if (!body.expenseHeadId) S.fail('Expense category is required');
  ok(res, await S.vehicleExpense(req.params.id, body, req.user));
}));
router.post('/vehicles/:id/expenses/:expenseId/reverse', wrap(async (req, res) => ok(res, await S.reverseVehicleExpense(req.params.id, req.params.expenseId, req.body.reason, req.user))));
router.get('/loads', wrap(async (req, res) => {
  const q = query(req); const data = await R.dataset(q);
  okResult(res, R.present(data.rows.filter(r => R.within(r.startDate, q)).map(({ trip, all, history, ...row }) => row), q), data.unclassified);
}));
function okResult(res, result, unclassified) { return res.json({ ...result, unclassifiedTrips: unclassified }); }
router.get('/loads/:id', wrap(async (req, res) => {
  const state = await sequelize.transaction(transaction => S.load(req.params.id, transaction));
  ok(res, { ...state, totals: state.account ? S.totals(state) : null, audit: await AccountingAudit.findAll({ where: { entity: 'TripAccount', entityId: state.account?.id || 0 }, order: [['id', 'ASC']] }) });
}));
router.put('/loads/:id/terms', wrap(async (req, res) => ok(res, await S.saveTerms(req.params.id, V.validate(V.terms, req.body), req.user))));
router.post('/loads/:id/transactions', wrap(async (req, res) => ok(res, await S.post(req.params.id, V.validate(V.posting, req.body), req.user))));
router.post('/loads/:id/reverse/:resource/:transactionId', wrap(async (req, res) => ok(res, await S.reverse(req.params.id, req.params.resource, req.params.transactionId, req.body.reason, req.user))));
router.put('/loads/:id/pod', wrap(async (req, res) => {
  const body = V.validate(V.pod, req.body);
  ok(res, await sequelize.transaction(async transaction => {
    const { trip, account } = await S.load(req.params.id, transaction, true);
    if (!account) S.fail('Enroll trip first');
    if (trip.status === 'Cancelled') S.fail('Cannot change POD on a cancelled load');
    if (account.version !== body.version) S.fail('Load changed. Reload before saving.', 409);
    if (body.podSubmissionDate && body.podSubmissionDate < trip.startDate) S.fail('POD submission cannot precede loading');
    if (body.podStatus === 'Approved' && !body.podSubmissionDate) S.fail('Submission date is required for approval');
    const before = { ...account.toJSON(), podStatus: trip.podStatus };
    await trip.update({ podStatus: body.podStatus }, { transaction });
    await account.update({ podSubmissionDate: body.podSubmissionDate || null, podDocument: body.podDocument || null, version: account.version + 1 }, { transaction });
    await S.audit('TripAccount', account.id, 'pod', before, { ...account.toJSON(), podStatus: trip.podStatus, remarks: body.remarks }, req.user, transaction);
    return account;
  }));
}));
router.post('/loads/:id/cancel', wrap(async (req, res) => {
  if (!req.body.reason || req.body.reason.length < 3) S.fail('Cancellation reason required');
  ok(res, await sequelize.transaction(async transaction => {
    const state = await S.load(req.params.id, transaction, true);
    if (!state.account) S.fail('Enroll load first');
    if ([...state.incomes, ...state.entries, ...state.expenses, ...state.diesels, ...state.advances].some(e => !e.voidedAt)) S.fail('Reverse all active transactions before cancelling the load');
    const before = state.trip.toJSON(); await state.trip.update({ status: 'Cancelled' }, { transaction });
    await S.audit('Trip', state.trip.id, 'cancel', before, { ...state.trip.toJSON(), reason: req.body.reason }, req.user, transaction); return state.trip;
  }));
}));
router.patch('/loads/:id/status', wrap(async (req, res) => {
  if (!['Pending', 'Running', 'Completed'].includes(req.body.status)) S.fail('Invalid status');
  ok(res, await sequelize.transaction(async transaction => {
    const { trip, account } = await S.load(req.params.id, transaction, true);
    if (!account || trip.status === 'Cancelled') S.fail('Cannot update this load');
    const before = trip.toJSON(); await trip.update({ status: req.body.status }, { transaction });
    await S.audit('Trip', trip.id, 'status', before, trip.toJSON(), req.user, transaction); return trip;
  }));
}));
router.get('/reports/:name', wrap(async (req, res) => {
  const q = query(req); const result = await R.report(req.params.name, q); const response = R.present(result.rows, q);
  if (q.format === 'csv') return res.type('text/csv').attachment(`${req.params.name}.csv`).send(R.csv(response.data));
  okResult(res, response, result.unclassified);
}));
router.get('/dashboard', wrap(async (req, res) => {
  const q = query(req), data = await R.dataset(q);
  const active = data.rows.filter(r => r.status !== 'Cancelled');
  const period = active.filter(r => R.within(r.startDate, q));
  const market = period.filter(r => r.classification === 'Market');
  const pl = R.vehiclePL(active, data.vehicles, q, data.standalone);
  const cash = R.cashActivity(data.rows, q);
  ok(res, { ownedVehicles: data.vehicles.filter(v => v.classification === 'Own').length, marketLoads: market.length,
    companyReceivables: m(sum(active, 'companyOutstanding')), ownerPayables: m(sum(active, 'ownerOutstanding')),
    companyCollections: m(sum(cash.filter(t => t.resource === 'income'))), ownerPayments: m(sum(cash.filter(t => t.resource === 'entry'))),
    ownedFleetIncome: m(sum(pl, 'totalIncome')), ownedFleetExpenses: m(sum(pl, 'totalExpenses')), ownedFleetProfit: m(sum(pl, 'netProfit')),
    brokerageGrossMargin: m(sum(market, 'grossMargin')), brokerageNetProfit: m(sum(market, 'netBrokerageProfit')), expectedMargin: m(sum(market, 'expectedMargin')), earnedMargin: m(sum(market, 'earnedMargin')), commissionReceived: m(sum(market, 'commissionReceived')), commissionReceivable: m(sum(market, 'commissionReceivable')),
    fundsAvailableBeforeOtherObligations: m(sum(active, 'settlementFunds') - sum(data.standalone.filter(e => !e.voidedAt && (!q.endDate || e.date <= q.endDate)))),
    pendingPODs: active.filter(r => r.paymentEligibility !== 'Eligible').length,
    overdueReceivables: m(sum(active.filter(r => r.account.dueDate < (q.endDate || R.day(new Date()))), 'companyOutstanding')),
    ownerPaymentsDue: m(sum(active.filter(r => r.account.ownerDueDate < (q.endDate || R.day(new Date()))), 'ownerOutstanding')),
    unclassifiedTrips: data.unclassified });
}));
module.exports = router;
