const { test } = require('node:test');
const assert = require('node:assert/strict');
const { cents, money } = require('../accounting/money');
const { settlement } = require('../accounting/calculations');
const { csv, ledger } = require('../accounting/reports');
const V = require('../accounting/validation');
const account = { classification:'Market',companyFreight:'50000.00',vehicleFreight:'43000.00',additionalIncome:'0.00',companyDeduction:'0.00',ownerDeduction:'0.00',brokerDeduction:'0.00',commissionExpense:'0.00',podRequired:true };
test('decimal arithmetic is exact and rejects fractional paise',()=>{
  assert.equal(money(cents('0.10')+cents('0.20')),'0.30');assert.equal(money(cents('-1.01')),'-1.01');
  for(const bad of ['NaN','1.001','1e4','Infinity'])assert.throws(()=>cents(bad));
});
test('50000 company freight and 43000 owner freight produce 7000 margin, independent of collections',()=>{
  const r=settlement({status:'Completed'},account,[{amount:'25000.00'}],[{kind:'owner_advance',amount:'10000.00'},{kind:'owner_payment',amount:'15000.00'}]);
  assert.equal(r.grossMargin,'7000.00');assert.equal(r.ownerOutstanding,'18000.00');assert.equal(r.companyOutstanding,'25000.00');assert.equal(r.commissionReceived,'0.00');assert.equal(r.commissionReceivable,'7000.00');assert.equal(r.paymentEligibility,'POD pending');
});
test('commission recognized only when completed and owner-first allocation caps cash earnings',()=>{
  const r=settlement({status:'Completed'},account,[{amount:'50000.00'}],[],[{amount:'1000.00'}]);
  assert.equal(r.commissionReceived,'6000.00');assert.equal(r.netBrokerageProfit,'6000.00');
  assert.equal(settlement({status:'Running'},account,[{amount:'50000.00'}]).earnedMargin,'0.00');
});
test('driver advances and adjustments do not add expenses',()=>{
  const r=settlement({status:'Completed'},{...account,classification:'Own',vehicleFreight:'0.00'},[],[{kind:'driver_adjustment',amount:'1000.00'}],[{amount:'20000.00'}]);
  assert.equal(r.totalExpenses,'20000.00');assert.equal(r.ownedProfit,'30000.00');assert.equal(r.ownerPayments,'0.00');
});
test('POD approval does not settle company payment',()=>{
  const r=settlement({status:'Completed',podStatus:'Approved'},{...account,podSubmissionDate:'2026-10-15'});
  assert.equal(r.paymentEligibility,'Eligible');assert.equal(r.paymentStatus,'Unpaid');assert.equal(r.companyOutstanding,'50000.00');
});
test('ledger computes opening balance before filtering and retains payment reversals',()=>{
 const row={status:'Completed',classification:'Market',ownerId:1,partyId:2,startDate:'2026-01-01',account,all:{incomes:[{date:'2026-01-03',amount:'10000.00',voidedAt:'2026-02-02T12:00:00Z'}]}};
 const lines=ledger([row],{startDate:'2026-02-01'},false);
 assert.equal(lines.length,1);assert.equal(lines[0].runningBalance,'50000.00');assert.equal(lines[0].type,'Payment reversal');
});
test('CSV escapes formulas and embedded commas/quotes',()=>{const out=csv([{name:'=cmd()',remarks:'"a,b"'}]);assert.ok(out.includes("'=cmd()"));assert.ok(out.includes('""a,b""'));});
test('validation rejects unknown fields and third decimal digit',()=>{assert.throws(()=>V.validate(V.posting,{kind:'company_payment',amount:'0.001',date:'2026-10-15',idempotencyKey:'1234567890123456'}));assert.throws(()=>V.validate(V.query,{sortOrder:'DROP TABLE'}));});

test('cash and cost reversals affect their reversal date without losing prior activity',()=>{
  const { activity } = require('../accounting/reports');
  const rows=[{date:'2026-01-01',amount:'100.10',voidedAt:'2026-02-01T12:00:00Z'}];
  assert.equal(activity(rows,{startDate:'2026-01-01',endDate:'2026-01-31'})[0].amount,'100.10');
  assert.equal(activity(rows,{startDate:'2026-02-01',endDate:'2026-02-28'})[0].amount,'-100.10');
});
