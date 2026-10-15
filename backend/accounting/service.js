const crypto = require('crypto');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const M = require('../models');
const { TripAccount, AccountingEntry: Entry, AccountingAudit: Audit } = require('./models');
const { cents: c, sum } = require('./money');
const { settlement } = require('./calculations');
const AppError = require('../utils/appError');
const fail = (message, code = 400) => { throw new AppError(message, code); };
const active = rows => rows.filter(r => !r.voidedAt);
const audit = (entity, entityId, action, before, after, user, transaction) => Audit.create({ entity, entityId, action, before, after, createdBy: user.id }, { transaction });
async function load(tripId, transaction, lock = false) {
  const trip = await M.Trip.findByPk(tripId, { transaction, ...(lock ? { lock: transaction.LOCK.UPDATE } : {}) });
  if (!trip) fail('Trip not found', 404);
  const account = await TripAccount.findOne({ where: { tripId }, transaction });
  const options = { where: { tripId }, transaction };
  const incomes = await M.IncomeLog.unscoped().findAll(options), entries = await Entry.findAll(options), expenses = await M.Expense.unscoped().findAll({ ...options, include: ['expenseHead'] }), diesels = await M.Diesel.unscoped().findAll(options), advances = await M.DriverAdvance.unscoped().findAll(options);
  return { trip, account, incomes, entries, expenses, diesels, advances };
}
const totals = state => settlement(state.trip, state.account, active(state.incomes), active(state.entries), active(state.expenses), active(state.diesels), active(state.advances));
async function saveTerms(tripId, body, user) {
  return sequelize.transaction(async transaction => {
    const state = await load(tripId, transaction, true), { trip, account } = state;
    if (trip.status === 'Cancelled') fail('Cancelled trips cannot be enrolled or revised');
    const vehicle = await M.Vehicle.findByPk(trip.vehicleId, { transaction, lock: transaction.LOCK.UPDATE });
    if (vehicle.classification !== body.classification) fail('Classify the vehicle before enrolling the trip');
    if (account && body.version !== account.version) fail('Terms changed. Reload before saving.', 409);
    if (account && account.classification !== body.classification) fail('An enrolled trip cannot change ownership classification');
    if (body.classification === 'Own' && (c(body.vehicleFreight) || c(body.ownerDeduction))) fail('Owned trips cannot have market freight');
    if (c(body.companyFreight) + c(body.additionalIncome) < c(body.companyDeduction)) fail('Company deduction exceeds billing');
    if (c(body.ownerDeduction) > c(body.vehicleFreight)) fail('Owner deduction exceeds freight');
    if (sum(active(state.incomes)) > c(body.companyFreight) + c(body.additionalIncome) - c(body.companyDeduction)) fail('Revised bill cannot be less than collections');
    if (sum(active(state.entries).filter(e => e.kind !== 'driver_adjustment')) > c(body.vehicleFreight) - c(body.ownerDeduction)) fail('Revised owner freight cannot be less than payments');
    if ([...active(state.expenses), ...active(state.diesels)].some(e => e.vehicleId && e.vehicleId !== trip.vehicleId)) fail('Reconcile existing costs: vehicle does not match trip');
    if (active(state.advances).some(a => a.driverId !== trip.driverId)) fail('Reconcile existing advances: driver does not match trip');
    if (active(state.expenses).some(e => /advance/i.test(e.expenseHead?.name || ''))) fail('Reconcile advance-category expenses before enrollment; advances must use DriverAdvances');
    if (active(state.incomes).some(i => i.partyId !== trip.partyId)) fail('Reconcile existing collections: company does not match trip');
    const { reconcileLegacy, version, ...terms } = body;
    const before = account ? account.toJSON() : null;
    const result = account ? await account.update({ ...terms, version: account.version + 1 }, { transaction }) : await TripAccount.create({ ...terms, tripId, ownerId: vehicle.ownerId, createdBy: user.id }, { transaction });
    const tripBefore = trip.toJSON();
    await trip.update({ freightAmount: body.companyFreight }, { transaction });
    await audit('Trip', trip.id, 'freight', tripBefore, trip.toJSON(), user, transaction);
    await audit('TripAccount', result.id, account ? 'revise' : 'enroll', before, result.toJSON(), user, transaction);
    return result;
  });
}
async function post(tripId, body, user) {
  return sequelize.transaction(async transaction => {
    const state = await load(tripId, transaction, true);
    if (!state.account) fail('Enroll the trip in accounting first');
    const { kind, idempotencyKey, ...fields } = body;
    const hashData = { tripId: Number(tripId), ...body };
    const requestHash = crypto.createHash('sha256').update(JSON.stringify(hashData, Object.keys(hashData).sort())).digest('hex');
    const Model = kind === 'company_payment' ? M.IncomeLog : kind === 'expense' ? M.Expense : kind === 'driver_advance' ? M.DriverAdvance : Entry;
    let previous;
    for (const Candidate of [M.IncomeLog, M.Expense, M.DriverAdvance, Entry]) {
      previous = await Candidate.unscoped().findOne({ where: { idempotencyKey }, transaction }); if (previous) break;
    }
    if (previous) { if (previous.requestHash !== requestHash) fail('Idempotency key already used for a different request', 409); return previous; }
    if (state.trip.status === 'Cancelled') fail('Cannot post to a cancelled load');
    if (c(fields.amount) <= 0n) fail('Amount must be greater than zero');
    if (fields.date < state.trip.startDate) fail('Transaction date cannot precede loading date');
    if (fields.paymentMethod !== 'Cash' && !fields.paymentReference) fail('A transaction reference is required for non-cash payments');
    const t = totals(state);
    if (kind === 'company_payment' && c(fields.amount) > c(t.companyOutstanding)) fail('Payment exceeds company outstanding');
    if (kind.startsWith('owner_')) {
      if (state.account.classification !== 'Market') fail('Owner settlements apply to market loads only');
      if (c(fields.amount) > c(t.ownerOutstanding)) fail('Payment exceeds owner outstanding');
    }
    if (fields.paymentReference && ['company_payment', 'owner_payment', 'owner_advance'].includes(kind)) {
      const where = { paymentReference: fields.paymentReference };
      if (Model === Entry) where.kind = { [Op.in]: ['owner_payment', 'owner_advance'] };
      if (await Model.unscoped().findOne({ where, transaction })) fail('This payment reference is already recorded', 409);
    }
    if (kind === 'expense') {
      if (!fields.expenseHeadId || !await M.ExpenseHead.findByPk(fields.expenseHeadId, { transaction })) fail('Select a valid expense category');
      const head = await M.ExpenseHead.findByPk(fields.expenseHeadId, { transaction });
      if (/advance/i.test(head.name)) fail('Use the driver advance transaction type; advances are not expenses');
    }
    if (kind === 'driver_advance' && state.account.classification !== 'Own') fail('Driver advances require an owned trip');
    if (kind === 'driver_adjustment') {
      const advance = await M.DriverAdvance.unscoped().findByPk(fields.advanceId, { transaction, lock: transaction.LOCK.UPDATE });
      const expense = await M.Expense.unscoped().findByPk(fields.expenseId, { transaction, lock: transaction.LOCK.UPDATE, include: ['expenseHead'] });
      if (!advance || !expense || advance.tripId !== Number(tripId) || expense.tripId !== Number(tripId) || advance.voidedAt || expense.voidedAt) fail('Select an active advance and salary expense from this trip');
      if (/advance/i.test(expense.expenseHead?.name || '')) fail('Adjustment must reference a recognized salary or trip expense');
      if (fields.date < advance.date || fields.date < expense.date) fail('Adjustment cannot precede its advance or salary');
      const adjustments = active(state.entries).filter(e => e.kind === kind);
      if (sum(adjustments.filter(e => e.advanceId === advance.id)) + c(fields.amount) > c(advance.amount)) fail('Adjustment exceeds unadjusted advance');
      if (sum(adjustments.filter(e => e.expenseId === expense.id)) + c(fields.amount) > c(expense.amount)) fail('Adjustment exceeds salary expense');
    }
    const values = { ...fields, tripId, createdBy: user.id, idempotencyKey, requestHash, paymentReference: fields.paymentReference || null };
    if (kind === 'company_payment') values.partyId = state.trip.partyId;
    if (kind === 'expense') values.vehicleId = state.trip.vehicleId;
    if (kind === 'driver_advance') values.driverId = state.trip.driverId;
    if (Model === Entry) { values.kind = kind; if (kind === 'driver_adjustment') values.paymentReference = null; }
    const row = await Model.create(values, { transaction });
    await audit(Model.name, row.id, 'post', null, row.toJSON(), user, transaction);
    return row;
  });
}
async function reverse(tripId, resource, id, reason, user) {
  const Model = { income: M.IncomeLog, expense: M.Expense, advance: M.DriverAdvance, diesel: M.Diesel, entry: Entry }[resource];
  if (!Model) fail('Unknown transaction type');
  if (typeof reason !== 'string' || reason.trim().length < 3 || reason.length > 2000) fail('A reversal reason is required');
  return sequelize.transaction(async transaction => {
    const state = await load(tripId, transaction, true);
    const row = await Model.unscoped().findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!row || row.tripId !== Number(tripId)) fail('Transaction not found', 404);
    if (row.voidedAt) return row;
    if (['advance', 'expense'].includes(resource) && active(state.entries).some(e => e.kind === 'driver_adjustment' && (resource === 'advance' ? e.advanceId : e.expenseId) === row.id)) fail('Reverse linked driver adjustments first');
    const before = row.toJSON();
    await row.update({ voidedAt: new Date(), voidReason: reason }, { transaction });
    await audit(Model.name, row.id, 'reverse', before, row.toJSON(), user, transaction);
    return row;
  });
}
module.exports = { load, totals, saveTerms, post, reverse, audit, fail, active };
// Insurance, repairs and other vehicle costs need not belong to a trip.
module.exports.vehicleExpense = async (vehicleId, body, user) => sequelize.transaction(async transaction => {
  const vehicle = await M.Vehicle.findByPk(vehicleId, { transaction, lock: transaction.LOCK.UPDATE });
  if (!vehicle || vehicle.classification !== 'Own') fail('Select a classified owned vehicle');
  const requestHash = crypto.createHash('sha256').update(JSON.stringify({ vehicleId: Number(vehicleId), ...body }, Object.keys({ vehicleId, ...body }).sort())).digest('hex');
  const previous = await M.Expense.unscoped().findOne({ where: { idempotencyKey: body.idempotencyKey }, transaction });
  if (previous) { if (previous.requestHash !== requestHash) fail('Idempotency key already used for a different request', 409); return previous; }
  const head = await M.ExpenseHead.findByPk(body.expenseHeadId, { transaction });
  if (!head || /advance/i.test(head.name)) fail('Select an expense category; record advances through trip accounting');
  if (c(body.amount) <= 0n) fail('Amount must be greater than zero');
  const result = await M.Expense.create({ ...body, vehicleId, tripId: null, createdBy: user.id, requestHash }, { transaction });
  await audit('Expense', result.id, 'post', null, result.toJSON(), user, transaction); return result;
});
module.exports.reverseVehicleExpense = async (vehicleId, id, reason, user) => sequelize.transaction(async transaction => {
  if (typeof reason !== 'string' || reason.trim().length < 3 || reason.length > 2000) fail('Reversal reason required');
  const vehicle = await M.Vehicle.findByPk(vehicleId, { transaction, lock: transaction.LOCK.UPDATE });
  if (!vehicle) fail('Vehicle not found', 404);
  const row = await M.Expense.unscoped().findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
  if (!row || row.vehicleId !== vehicle.id || row.tripId) fail('Standalone vehicle expense not found', 404);
  if (!row.voidedAt) {const before = row.toJSON();await row.update({ voidedAt: new Date(), voidReason: reason }, { transaction });await audit('Expense', row.id, 'reverse', before, row.toJSON(), user, transaction);}
  return row;
});
