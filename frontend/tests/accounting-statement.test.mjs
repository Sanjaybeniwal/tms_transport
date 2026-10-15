import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reportStatement, tripStatement } from '../src/utils/accountingStatement.js';

test('ledger statement splits debit/credit exactly and does not sum running balances', () => {
  const doc = reportStatement('company-ledger', 'Company Ledger', [
    {amount:'50000.10',runningBalance:'50000.10'},
    {amount:'-10000.20',runningBalance:'39999.90'}
  ], ['date','amount','runningBalance']);
  assert.deepEqual(doc.fields, ['date','debit','credit','runningBalance']);
  assert.equal(doc.rows[1].credit, '10000.20');
  assert.deepEqual(doc.summary.map(s => s.value), ['50000.10','10000.20','39999.90']);
});
test('owner statement includes all rows and exact summary totals', () => {
  const rows = Array.from({length:30}, () => ({totalFreight:'0.10',settled:'0.05',remainingPayable:'0.05'}));
  const doc = reportStatement('owner-accounts', 'Owner Accounts', rows, ['remainingPayable']);
  assert.equal(doc.rows.length, 30);
  assert.deepEqual(doc.summary.map(s => s.value), ['3.00','1.50','1.50']);
});
test('reversed advance remains visible but does not inflate active advance summary', () => {
  const doc = reportStatement('driver-advances', 'Driver Advances', [
    {amount:'1000.00',adjusted:'200.00',unadjusted:'800.00'},
    {amount:'500.00',adjusted:'0.00',unadjusted:'500.00',transactionStatus:'Reversed'}
  ], ['amount']);
  assert.equal(doc.rows.length, 2);assert.equal(doc.summary[0].value, '1000.00');
});
test('trip statement retains sources and uses authoritative API balances', () => {
  const detail = {trip:{tripNumber:'T1',startDate:'2026-10-01'}, account:{classification:'Own'}, totals:{companyBilled:'50000.00',companyCollected:'10000.00',companyOutstanding:'40000.00',ownedIncome:'50000.00',totalExpenses:'5000.00',ownedProfit:'45000.00'}, incomes:[{date:'2026-10-02',amount:'10000.00'}], entries:[], expenses:[], diesels:[], advances:[{date:'2026-10-03',amount:'1000.00'}]};
  const doc = tripStatement(detail, {});
  assert.equal(doc.rows.length, 2);assert.equal(doc.summary[2].value, '40000.00');
  const voucher=tripStatement(detail, {}, {...detail.incomes[0],id:5,voidedAt:'2026-10-04'});
  assert.equal(voucher.rows[0].transactionStatus,'Reversed');assert.equal(voucher.summary[0].value,'10000.00');
});
