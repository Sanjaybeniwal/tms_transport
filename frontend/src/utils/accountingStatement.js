// Display-only statement models. Business balances continue to come from the API.
import { labelFor, transactionLabels } from '../components/accounting/labels.js';
const minorUnits = value => {
  const match = String(value ?? '0').match(/^(-?)(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) throw new Error('Invalid monetary value in statement');
  return (match[1] ? -1n : 1n) * (BigInt(match[2]) * 100n + BigInt((match[3] || '').padEnd(2, '0')));
};
const decimal = value => `${value < 0n ? '-' : ''}${(value < 0n ? -value : value) / 100n}.${String((value < 0n ? -value : value) % 100n).padStart(2, '0')}`;
const sum = (rows, key) => decimal(rows.reduce((total, row) => total + minorUnits(row[key]), 0n));
const reportTotals = {
  'company-accounts': ['totalBilled', 'received', 'outstanding'],
  'owner-accounts': ['totalFreight', 'settled', 'remainingPayable'],
  'vehicle-pl': ['totalIncome', 'totalExpenses', 'netProfit'],
  income: ['freightIncome', 'companyCollected', 'companyOutstanding'],
  receivables: ['companyBilled', 'companyCollected', 'companyOutstanding'],
  payables: ['ownerFreight', 'ownerPayments', 'ownerOutstanding'],
  'brokerage-profit': ['grossMargin', 'totalExpenses', 'netBrokerageProfit'],
  settlements: ['companyOutstanding', 'ownerOutstanding'],
  'driver-advances': ['amount', 'adjusted', 'unadjusted']
};
export function reportStatement(name, title, rows, fields, context = {}) {
  const isLedger = name.endsWith('-ledger');
  const output = rows.map(row => {
    if (!isLedger) return row;
    const amount = minorUnits(row.amount);
    return { ...row, debit: amount > 0n ? decimal(amount) : '0.00', credit: amount < 0n ? decimal(-amount) : '0.00' };
  });
  const columns = isLedger ? fields.flatMap(key => key === 'amount' ? ['debit', 'credit'] : [key]) : fields;
  const summary = isLedger
    ? [{ label: 'Total Debits', value: sum(output, 'debit') }, { label: 'Total Credits', value: sum(output, 'credit') }, { label: 'Net Movement', value: sum(output, 'amount') }]
    : (reportTotals[name] || []).map(key => ({ label: labelFor(key), value: sum(rows.filter(row => !row.voidedAt && row.transactionStatus !== 'Reversed'), key) }));
  return { ...context, title, rows: output, fields: columns, summary, recordCount: rows.length, note: isLedger ? 'Running balances are calculated separately for each account. Net movement is for the selected period.' : 'All matching records are included. Reversed entries, where shown, are identified in the transaction status.' };
}
export function tripStatement(detail, masters, voucher) {
  const trip = detail.trip;
  const company = masters.companies?.find(c => c.id === trip.partyId);
  const owner = masters.owners?.find(o => o.id === detail.account?.ownerId);
  const vehicle = masters.vehicles?.find(v => v.id === trip.vehicleId);
  const types = { incomes: 'Company Payment Received', expenses: 'Expense', diesels: 'Fuel Purchase', advances: 'Driver Advance' };
  const rows = voucher ? [{ ...voucher, type: transactionLabels[voucher.kind] || voucher.type || 'Payment', transactionStatus: voucher.voidedAt ? 'Reversed' : 'Posted', amount: voucher.amount || voucher.totalAmount }]
    : Object.keys(types).concat('entries').flatMap(resource => (detail[resource] || []).map(row => ({ ...row, type: transactionLabels[row.kind] || row.expenseHead?.name || types[resource], amount: row.amount || row.totalAmount, transactionStatus: row.voidedAt ? 'Reversed' : 'Posted' }))).sort((a,b) => String(a.date).localeCompare(String(b.date)));
  const summary = voucher ? [{ label: 'Voucher Amount', value: voucher.amount || voucher.totalAmount }]
    : !detail.account ? [] : ['companyBilled','companyCollected','companyOutstanding', ...(detail.account?.classification === 'Market' ? ['ownerFreight','ownerPayments','ownerOutstanding'] : ['ownedIncome','totalExpenses','ownedProfit'])].map(key => ({ label: labelFor(key), value: detail.totals?.[key] }));
  return {
    title: voucher ? 'Payment Voucher' : 'Load Account Statement',
    subject: company?.name || 'Trip Account',
    details: [`Trip: ${trip.tripNumber}`, vehicle && `Vehicle: ${vehicle.vehicleNumber}`, detail.account?.classification === 'Market' && owner && `Vehicle Owner: ${owner.name}`, voucher && `Voucher Reference: ${voucher.id}`].filter(Boolean),
    startDate: voucher?.date || trip.startDate, endDate: voucher?.date || '',
    rows, fields: ['date','type','amount','paymentMethod','paymentReference','transactionStatus','remarks'], summary,
    recordCount: rows.length, note: voucher ? 'This voucher records an accounting entry. Reversed entries do not represent an active payment.' : 'Company collections, owner payments, expenses and driver advances are separate transaction types. Totals are calculated from active entries.'
  };
}
