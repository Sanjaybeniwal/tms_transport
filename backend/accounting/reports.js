const { sequelize } = require('../config/database');
const M = require('../models');
const { TripAccount, AccountingEntry, AccountingAudit } = require('./models');
const { settlement } = require('./calculations');
const { cents: c, money: m, sum } = require('./money');
const V = require('./validation');
const { fail } = require('./service');
const day = value => typeof value === 'string' ? value.slice(0, 10) : new Date(value).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
const within = (date, q) => (!q.startDate || date >= q.startDate) && (!q.endDate || date <= q.endDate);
const liveAt = (rows, q) => rows.filter(r => (!q.endDate || r.date <= q.endDate) && (!r.voidedAt || (q.endDate && day(r.voidedAt) > q.endDate)));
async function dataset(q) {
  return sequelize.transaction(async transaction => {
    const accounts = await TripAccount.findAll({ transaction, raw: true });
    const trips = await M.Trip.findAll({ transaction, include: ['vehicle', 'party', 'driver', 'fromLocation', 'toLocation'], order: [['startDate', 'ASC'], ['id', 'ASC']] });
    const incomes = await M.IncomeLog.unscoped().findAll({ transaction, raw: true });
    const entries = await AccountingEntry.findAll({ transaction, raw: true });
    const expenses = await M.Expense.unscoped().findAll({ transaction, include: ['expenseHead'] });
    const diesels = await M.Diesel.unscoped().findAll({ transaction, raw: true });
    const advances = await M.DriverAdvance.unscoped().findAll({ transaction, raw: true });
    const owners = await M.Owner.findAll({ transaction, raw: true });
    const audits = (await AccountingAudit.findAll({ transaction, raw: true, order: [['id', 'ASC']] })).map(h => ({ ...h, before: typeof h.before === 'string' ? JSON.parse(h.before) : h.before, after: typeof h.after === 'string' ? JSON.parse(h.after) : h.after }));
    const rows = [];
    for (const model of trips) {
      let trip = model.toJSON(), a = accounts.find(x => x.tripId === trip.id);
      const history = a ? audits.filter(h => h.entity === 'TripAccount' && h.entityId === a.id) : [];
      if (q.endDate) {
        for (const h of [...history].reverse()) if (day(h.createdAt) > q.endDate && h.before) {
          a = { ...a, ...h.before }; if (h.action === 'pod') trip.podStatus = h.before.podStatus;
        }
        for (const h of [...audits].reverse()) if (h.entity === 'Trip' && h.entityId === trip.id && day(h.createdAt) > q.endDate && h.before) trip = { ...trip, ...h.before };
      }
      if (!a || q.vehicleId && trip.vehicleId !== q.vehicleId || q.ownerId && a.ownerId !== q.ownerId || q.partyId && trip.partyId !== q.partyId || q.tripId && trip.id !== q.tripId || q.classification && a.classification !== q.classification || q.status && trip.status !== q.status || q.endDate && trip.startDate > q.endDate) continue;
      const byTrip = list => list.filter(x => x.tripId === trip.id).map(x => x.toJSON ? x.toJSON() : x);
      const all = { incomes: byTrip(incomes), entries: byTrip(entries), expenses: byTrip(expenses), diesels: byTrip(diesels), advances: byTrip(advances) };
      const totals = settlement(trip, a, liveAt(all.incomes, q), liveAt(all.entries, q), liveAt(all.expenses, q), liveAt(all.diesels, q), liveAt(all.advances, q));
      const row = { id: trip.id, tripNumber: trip.tripNumber, startDate: trip.startDate, status: trip.status, vehicleId: trip.vehicleId, vehicle: trip.vehicle?.vehicleNumber, partyId: trip.partyId, company: trip.party?.name, ownerId: a.ownerId, owner: owners.find(o => o.id === a.ownerId)?.name, ownerContact: owners.find(o => o.id === a.ownerId)?.mobile, driver: trip.driver?.name, source: trip.fromLocation?.name, destination: trip.toLocation?.name, classification: a.classification, podStatus: trip.podStatus, ...totals, account: a, trip, all, history };
      if (q.paymentStatus && row.paymentStatus !== q.paymentStatus) continue;
      if (q.ownerPaymentStatus && row.ownerPaymentStatus !== q.ownerPaymentStatus) continue;
      rows.push(row);
    }
    const vehicles = await M.Vehicle.findAll({ transaction, raw: true });
    const standalone = [...expenses.filter(e => !e.tripId).map(e => ({ ...e.toJSON(), category: e.expenseHead?.name, resource: 'expense' })), ...diesels.filter(e => !e.tripId).map(e => ({ ...e, amount: e.totalAmount, category: 'Fuel', resource: 'diesel' }))].filter(e => {
      const v = vehicles.find(v => v.id === e.vehicleId);
      return v?.classification === 'Own' && !q.partyId && !q.tripId && (!q.vehicleId || q.vehicleId === v.id) && (!q.ownerId || q.ownerId === v.ownerId) && (!q.classification || q.classification === 'Own');
    }).map(e => ({ ...e, vehicle: vehicles.find(v => v.id === e.vehicleId)?.vehicleNumber, transactionId: e.id, transactionStatus: e.voidedAt ? 'Reversed' : 'Posted' }));
    return { rows, unclassified: trips.filter(t => !accounts.some(a => a.tripId === t.id)).length, vehicles, standalone };
  });
}
const clean = ({ account, trip, all, history, ...row }) => row;
function transactionRows(rows, type, q) {
  const result = [];
  for (const r of rows) {
    for (const source of type === 'expenses' ? ['expenses', 'diesels'] : type === 'payments' ? ['incomes', 'entries'] : ['advances']) {
      for (const tx of r.all[source]) {
        if (!within(tx.date, q)) continue;
        if (type === 'payments' && tx.kind === 'driver_adjustment') continue;
        const adjusted = source === 'advances' ? sum(liveAt(r.all.entries, q).filter(e => e.kind === 'driver_adjustment' && e.advanceId === tx.id)) : 0n;
        result.push({ ...clean(r), ...tx, id: `${source}-${tx.id}`, amount: tx.amount || tx.totalAmount, category: tx.expenseHead?.name || (source === 'diesels' ? 'Fuel' : tx.kind || source), resource: { incomes: 'income', entries: 'entry', expenses: 'expense', diesels: 'diesel', advances: 'advance' }[source], transactionId: tx.id, tripId: r.id, adjusted: m(adjusted), unadjusted: source === 'advances' ? m(c(tx.amount) - adjusted) : undefined, transactionStatus: tx.voidedAt ? 'Reversed' : 'Posted' });
      }
    }
  }
  return result;
}
function ledger(rows, q, owner) {
  const lines = [];
  for (const r of rows.filter(r => !owner || r.classification === 'Market')) {
    if (r.status === 'Cancelled') continue;
    const entityId = owner ? r.ownerId : r.partyId;
    const add = (date, type, amount, reference = '', remarks = '') => lines.push({ date, type, amount: m(amount), entityId, company: r.company, owner: r.owner, tripNumber: r.tripNumber, vehicle: r.vehicle, reference, remarks });
    const original = r.history?.find(h => h.action === 'enroll')?.after || r.account;
    add(r.startDate, 'Freight', c(owner ? original.vehicleFreight : original.companyFreight));
    if (!owner) add(r.startDate, 'Additional income', c(original.additionalIncome));
    add(r.startDate, 'Deduction', -c(owner ? original.ownerDeduction : original.companyDeduction));
    const entitlement = a => owner ? c(a.vehicleFreight) - c(a.ownerDeduction) : c(a.companyFreight) + c(a.additionalIncome) - c(a.companyDeduction);
    for (const h of r.history || []) if (h.action === 'revise') add(day(h.createdAt), 'Freight revision', entitlement(h.after) - entitlement(h.before), '', h.after.remarks);
    for (const p of owner ? r.all.entries.filter(e => e.kind.startsWith('owner_')) : r.all.incomes) {
      add(p.date, p.kind || 'Company collection', -c(p.amount), p.paymentReference, p.remarks);
      if (p.voidedAt) add(day(p.voidedAt), 'Payment reversal', c(p.amount), p.paymentReference, p.voidReason);
    }
  }
  lines.sort((a, b) => a.date.localeCompare(b.date));
  const balances = new Map();
  for (const line of lines) {
    const next = (balances.get(line.entityId) || 0n) + c(line.amount);
    balances.set(line.entityId, next); line.runningBalance = m(next);
  }
  return lines.filter(l => c(l.amount) !== 0n && within(l.date, q));
}
function activity(rows, q) {
  const result = [];
  for (const row of rows) {
    if (within(row.date, q)) result.push({ ...row });
    if (row.voidedAt && within(day(row.voidedAt), q)) result.push({ ...row, date: day(row.voidedAt), amount: row.amount ? m(-c(row.amount)) : undefined, totalAmount: row.totalAmount ? m(-c(row.totalAmount)) : undefined });
  }
  return result;
}
function cashActivity(rows, q) {
  return rows.flatMap(r => [...activity(r.all.incomes, q).map(i => ({ ...i, resource: 'income' })), ...activity(r.all.entries.filter(e => e.kind.startsWith('owner_')), q).map(e => ({ ...e, resource: 'entry' }))]);
}
function vehiclePL(rows, vehicles, q, standalone = []) {
  return vehicles.filter(v => v.classification === 'Own' && (!q.vehicleId || v.id === q.vehicleId)).map(v => {
    const trips = rows.filter(r => r.vehicleId === v.id && r.classification === 'Own' && r.status !== 'Cancelled');
    const recognized = trips.filter(r => within(r.startDate, q));
    const movementKeys = ['companyFreight', 'additionalIncome', 'companyDeduction', 'commissionExpense', 'brokerDeduction'];
    const movements = [];
    for (const r of trips) {
      const original = r.history?.find(h => h.action === 'enroll')?.after || r.account;
      if (within(r.startDate, q)) movements.push(original);
      for (const h of r.history || []) if (h.action === 'revise' && within(day(h.createdAt), q)) movements.push(Object.fromEntries(movementKeys.map(key => [key, m(c(h.after[key]) - c(h.before[key]))])));
    }
    const termTotal = key => sum(movements.map(a => ({ amount: a[key] })));

    const expenseRows = activity([...trips.flatMap(r => r.all.expenses), ...standalone.filter(e => e.vehicleId === v.id && e.resource === 'expense')], q);
    const dieselRows = activity([...trips.flatMap(r => r.all.diesels), ...standalone.filter(e => e.vehicleId === v.id && e.resource === 'diesel')], q);
    const advances = activity(trips.flatMap(r => r.all.advances), q);
    const adjustments = activity(trips.flatMap(r => r.all.entries).filter(e => e.kind === 'driver_adjustment'), q);
    const toll = sum(expenseRows.filter(e => /toll|fastag/i.test(e.expenseHead?.name || '')));
    const maintenance = sum(expenseRows.filter(e => /maintenance|repair|tyre|spare/i.test(e.expenseHead?.name || '')));
    const salary = sum(expenseRows.filter(e => /salary/i.test(e.expenseHead?.name || '')));
    const fuel = sum(dieselRows, 'totalAmount') + sum(expenseRows.filter(e => /fuel|diesel|petrol/i.test(e.expenseHead?.name || '')));
    const totalExpenses = sum(expenseRows) + sum(dieselRows, 'totalAmount') + termTotal('commissionExpense') + termTotal('brokerDeduction');
    const income = termTotal('companyFreight') + termTotal('additionalIncome') - termTotal('companyDeduction');
    return { vehicleId: v.id, vehicle: v.vehicleNumber, totalTrips: recognized.length, freightIncome: m(termTotal('companyFreight')), additionalIncome: m(termTotal('additionalIncome')), totalIncome: m(income), fuelExpenses: m(fuel), tollExpenses: m(toll), maintenanceExpenses: m(maintenance), driverSalary: m(salary), driverAdvances: m(sum(advances)), advanceAdjustments: m(sum(adjustments)), otherExpenses: m(totalExpenses - fuel - toll - maintenance - salary), totalExpenses: m(totalExpenses), netProfit: m(income - totalExpenses), incomeReceived: m(sum(activity(trips.flatMap(r => r.all.incomes), q))), incomeOutstanding: m(sum(trips, 'companyOutstanding')) };
  });
}
function accountSummary(rows, owner, q) {
  const grouped = new Map();
  for (const r of rows.filter(r => !owner || r.classification === 'Market')) {
    const id = owner ? r.ownerId : r.partyId;
    if (!grouped.has(id)) grouped.set(id, []); grouped.get(id).push(r);
  }
  return [...grouped].map(([id, loads]) => {
    const amount = key => m(sum(loads, key));
    const base = { id, name: owner ? loads[0].owner : loads[0].company, contact: owner ? loads[0].ownerContact : loads[0].trip.party?.mobile, totalLoads: loads.length, pendingPODs: loads.filter(r => r.paymentEligibility !== 'Eligible').length };
    return owner ? { ...base, totalFreight: amount('ownerFreight'), advances: amount('ownerAdvances'), additionalPayments: m(sum(loads, 'ownerPayments') - sum(loads, 'ownerAdvances')), deductions: m(sum(loads.map(r => ({ amount: r.account.ownerDeduction })))), settled: amount('ownerPayments'), remainingPayable: amount('ownerOutstanding') } : { ...base, totalFreight: m(sum(loads.map(r => ({ amount: r.account.companyFreight })))), additionalIncome: amount('additionalIncome'), deductions: m(sum(loads.map(r => ({ amount: r.account.companyDeduction })))), totalBilled: amount('companyBilled'), received: amount('companyCollected'), outstanding: amount('companyOutstanding'), overdue: m(sum(loads.filter(r => r.account.dueDate < (q.endDate || day(new Date()))), 'companyOutstanding')), expectedBrokerage: amount('expectedMargin'), earnedBrokerage: amount('earnedMargin') };
  });
}
function vehicleLedger(rows, standalone, q) {
  const lines = [];
  const add = (vehicleId, vehicle, date, type, amount, detail = {}) => lines.push({vehicleId,vehicle,date,type,amount:m(amount),...detail});
  for (const r of rows.filter(r => r.classification === 'Own')) {
    const original = r.history?.find(h => h.action === 'enroll')?.after || r.account;
    const income = a => c(a.companyFreight) + c(a.additionalIncome) - c(a.companyDeduction) - c(a.commissionExpense) - c(a.brokerDeduction);
    add(r.vehicleId,r.vehicle,r.startDate,'Recognized income',income(original),{tripNumber:r.tripNumber});
    for (const h of r.history || []) if (h.action === 'revise') add(r.vehicleId,r.vehicle,day(h.createdAt),'Income revision',income(h.after)-income(h.before),{tripNumber:r.tripNumber});
    for (const e of [...r.all.expenses,...r.all.diesels]) {
      const amount = c(e.amount || e.totalAmount);
      add(r.vehicleId,r.vehicle,e.date,e.expenseHead?.name || 'Fuel',-amount,{tripNumber:r.tripNumber,remarks:e.remarks});
      if(e.voidedAt)add(r.vehicleId,r.vehicle,day(e.voidedAt),'Expense reversal',amount,{tripNumber:r.tripNumber,remarks:e.voidReason});
    }
    for (const e of r.all.incomes) add(r.vehicleId,r.vehicle,e.date,'Collection (cash only)',0n,{tripNumber:r.tripNumber,cashAmount:e.amount,remarks:e.remarks});
    for (const e of r.all.advances) add(r.vehicleId,r.vehicle,e.date,'Driver advance (asset)',0n,{tripNumber:r.tripNumber,cashAmount:e.amount,remarks:e.remarks});
  }
  for(const e of standalone){add(e.vehicleId,e.vehicle,e.date,e.category,-c(e.amount));if(e.voidedAt)add(e.vehicleId,e.vehicle,day(e.voidedAt),'Expense reversal',c(e.amount),{remarks:e.voidReason});}
  lines.sort((a,b)=>a.date.localeCompare(b.date));const balances=new Map();
  for(const l of lines){const b=(balances.get(l.vehicleId)||0n)+c(l.amount);balances.set(l.vehicleId,b);l.runningBalance=m(b);}
  return lines.filter(l=>within(l.date,q));
}
const names = ['vehicle-pl', 'expenses', 'income', 'company-ledger', 'owner-ledger', 'brokerage-profit', 'settlements', 'receivables', 'payables', 'payments', 'driver-advances', 'pod-pending', 'company-accounts', 'owner-accounts', 'vehicle-ledger'];
async function report(name, q) {
  if (!names.includes(name)) fail('Unknown report', 404);
  const data = await dataset(q), { rows } = data;
  const current = rows.filter(r => r.status !== 'Cancelled');
  let result;
  if (name === 'vehicle-ledger') result = vehicleLedger(current, data.standalone, q);
  else if (name === 'company-accounts' || name === 'owner-accounts') result = accountSummary(current, name === 'owner-accounts', q);
  else if (name === 'vehicle-pl') result = vehiclePL(current, data.vehicles, q, data.standalone);
  else if (['expenses', 'payments', 'driver-advances'].includes(name)) result = transactionRows(rows, name === 'driver-advances' ? 'advances' : name, q);
  else if (name.endsWith('-ledger')) result = ledger(rows, q, name === 'owner-ledger');
  else result = current.filter(r => {
    if (name === 'receivables') return c(r.companyOutstanding) > 0n;
    if (name === 'payables') return r.classification === 'Market' && c(r.ownerOutstanding) > 0n;
    if (name === 'pod-pending') return r.account.podRequired && (!r.account.podSubmissionDate || r.podStatus !== 'Approved');
    return within(r.startDate, q) && (name !== 'brokerage-profit' || r.classification === 'Market') && (name !== 'income' || r.classification === 'Own');
  }).map(r => ({ ...clean(r), dueDate: r.account.dueDate, ownerDueDate: r.account.ownerDueDate, overdue: r.account.dueDate < (q.endDate || day(new Date())) && c(r.companyOutstanding) > 0n }));
  if (name === 'expenses') result.push(...data.standalone.filter(e => within(e.date, q)));
  return { rows: result, unclassified: data.unclassified };
}
function present(rows, q) {
  let filtered = rows;
  if (q.search) filtered = rows.filter(r => Object.values(r).some(v => typeof v !== 'object' && String(v).toLowerCase().includes(q.search.toLowerCase())));
  if (q.sortBy) {
    if (filtered.length && !Object.hasOwn(filtered[0], q.sortBy)) fail('Invalid sort column');
    filtered.sort((a, b) => String(a[q.sortBy] ?? '').localeCompare(String(b[q.sortBy] ?? ''), undefined, { numeric: true }) * (q.sortOrder === 'DESC' ? -1 : 1));
  }
  return { status: 'success', total: filtered.length, page: q.page, pages: Math.ceil(filtered.length / q.limit), data: q.format ? filtered : filtered.slice((q.page - 1) * q.limit, q.page * q.limit) };
}
function csv(rows) {
  const keys = [...new Set(rows.flatMap(r => Object.keys(r).filter(k => typeof r[k] !== 'object')))];
  const cell = v => { let t = String(v ?? ''); if (/^[=+\-@\t\r]/.test(t)) t = `'${t}`; return `"${t.replace(/"/g, '""')}"`; };
  return '\uFEFF' + [keys, ...rows.map(r => keys.map(k => r[k]))].map(row => row.map(cell).join(',')).join('\r\n');
}
module.exports = { cashActivity, activity, dataset, report, present, csv, names, within, day, vehiclePL, transactionRows, ledger };
