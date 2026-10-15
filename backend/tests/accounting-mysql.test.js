const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const enabled = process.env.ACCOUNTING_MYSQL_TEST === 'true';
if (!enabled) { test('MySQL integration (set ACCOUNTING_MYSQL_TEST=true on an isolated test database)', {skip:true},()=>{}); }
else {
  require('dotenv').config();
  if (!/^tms_accounting_test_[a-z0-9_]+$/.test(process.env.DB_NAME || '')) throw new Error('Use a dedicated DB_NAME=tms_accounting_test_<name>');
  const mysql = require('mysql2/promise');
  const { sequelize } = require('../config/database');
  sequelize.options.logging = false;
  const M = require('../models');
  const { TripAccount, AccountingEntry, AccountingAudit } = require('../accounting/models');
  const S = require('../accounting/service');
  const R = require('../accounting/reports');
  const V = require('../accounting/validation');
  let admin, trip, market, driver, head, connection, server, baseURL, token, createdDatabase = false;
  const terms = {classification:'Market',companyFreight:'50000.00',vehicleFreight:'43000.00',additionalIncome:'0.00',companyDeduction:'0.00',ownerDeduction:'0.00',brokerDeduction:'0.00',commissionExpense:'0.00',dueDate:'2026-10-31',ownerDueDate:'2026-10-31',podRequired:true,reconcileLegacy:true};
  let n=0;
  const post=(kind,amount,extra={})=>S.post(trip.id,V.validate(V.posting,{kind,amount,date:'2026-10-15',idempotencyKey:`test-request-${String(++n).padStart(8,'0')}`,...extra}),admin);
  before(async()=>{
    connection=await mysql.createConnection({host:process.env.DB_HOST||'localhost',port:process.env.DB_PORT||3306,user:process.env.DB_USER||'root',password:process.env.DB_PASSWORD||'',...(process.env.DB_SOCKET?{socketPath:process.env.DB_SOCKET}:{})});
    // Never connect these tests to an existing database.
    const [existing]=await connection.query('SHOW DATABASES LIKE ?', [process.env.DB_NAME]);
    if(existing.length)throw new Error('Test database already exists; choose another name');
    await connection.query(`CREATE DATABASE \`${process.env.DB_NAME}\``);createdDatabase=true;
    await sequelize.sync();
    // Verify the additive migration is repeatable on already updated tables.
    await require('../accounting/migrate')();await require('../accounting/migrate')();
    admin=await M.User.create({name:'Test',email:'accounting-test@example.com',password:'test-only-password',role:'Admin'});
    const owner=await M.Owner.create({name:'Test owner',mobile:'9999999999'});
    market=await M.Vehicle.create({vehicleNumber:'TEST0001',vehicleType:'Truck',ownerId:owner.id,rcNumber:'TEST',classification:'Market'});
    driver=await M.Driver.create({name:'Test driver',mobile:'9999999999',licenseNumber:'TESTDL',licenseExpiry:'2030-01-01',joiningDate:'2026-01-01',salary:'20000.00'});
    const from=await M.Location.create({name:'Delhi',city:'Delhi',state:'Delhi'}),to=await M.Location.create({name:'Mumbai',city:'Mumbai',state:'Maharashtra'});
    const party=await M.Party.create({name:'Test company',mobile:'9999999999'});
    head=await M.ExpenseHead.findOne({where:{name:'Driver Salary'}});
    trip=await M.Trip.create({tripNumber:'TEST-001',vehicleId:market.id,driverId:driver.id,fromLocationId:from.id,toLocationId:to.id,partyId:party.id,freightAmount:'50000.00',startDate:'2026-10-01',status:'Completed'});
    const express = require('express'); const app = express(); app.use(express.json());app.use('/api/v1',require('../routes/api'));app.use(require('../middleware/errorMiddleware'));
    server = await new Promise(resolve => {const running = app.listen(0,'127.0.0.1',()=>resolve(running));});
    baseURL = `http://127.0.0.1:${server.address().port}/api/v1`;
    token = require('jsonwebtoken').sign({id:admin.id},process.env.JWT_SECRET || 'super_secret_tms_token_signing_key_2026_production_grade');
  });
  after(async()=>{if(server)await new Promise(resolve=>server.close(resolve));await sequelize.close();if(connection){if(createdDatabase)await connection.query(`DROP DATABASE IF EXISTS \`${process.env.DB_NAME}\``);await connection.end();}});
  test('transaction-safe accounting lifecycle',async()=>{
    await S.saveTerms(trip.id,V.validate(V.terms,terms),admin);
    const first=await post('owner_advance','10000.00');
    const body=V.validate(V.posting,{kind:'owner_payment',amount:'15000.00',date:'2026-10-15',idempotencyKey:'stable-payment-key-0001'});
    const p=await S.post(trip.id,body,admin);const retry=await S.post(trip.id,body,admin);assert.equal(p.id,retry.id);
    await assert.rejects(()=>S.post(trip.id,{...body,amount:'1.00'},admin),/different request/);
    let state=await S.load(trip.id);assert.equal(S.totals(state).ownerOutstanding,'18000.00');
    const concurrent=await Promise.allSettled([post('owner_payment','18000.00'),post('owner_payment','18000.00')]);
    assert.equal(concurrent.filter(r=>r.status==='fulfilled').length,1);assert.equal(concurrent.filter(r=>r.status==='rejected').length,1);
    const collection=await post('company_payment','20000.00');await post('company_payment','30000.00');await assert.rejects(()=>post('company_payment','0.01'),/exceeds/);
    state=await S.load(trip.id);assert.equal(S.totals(state).companyOutstanding,'0.00');assert.equal(S.totals(state).grossMargin,'7000.00');
    await S.reverse(trip.id,'income',collection.id,'Incorrect reference',admin);
    state=await S.load(trip.id);assert.equal(S.totals(state).companyOutstanding,'20000.00');
    await assert.rejects(()=>S.saveTerms(trip.id,{...terms,version:1,vehicleFreight:'10000.00'},admin),/less than payments/);
    const revised=await S.saveTerms(trip.id,{...terms,version:1,companyFreight:'51000.00'},admin);assert.equal(revised.version,2);
    await assert.rejects(()=>S.saveTerms(trip.id,{...terms,version:1},admin),/changed/);
    await S.reverse(trip.id,'entry',first.id,'Duplicate owner advance',admin);assert.equal(S.totals(await S.load(trip.id)).ownerOutstanding,'10000.00');
    assert.ok(await AccountingAudit.count()>=8);
    const reports=await R.report('owner-ledger',V.validate(V.query,{}));assert.ok(reports.rows.length>0);
    assert.equal(await M.IncomeLog.unscoped().count(),2);assert.equal(await TripAccount.count(),1);
  });
  test('advance adjustment is bounded, reversible and counted once',async()=>{
    const own=await M.Vehicle.create({vehicleNumber:'TEST0002',vehicleType:'Truck',ownerId:market.ownerId,rcNumber:'TEST2',classification:'Own'});
    const t=await M.Trip.create({...trip.toJSON(),id:undefined,tripNumber:'TEST-002',vehicleId:own.id});
    await S.saveTerms(t.id,{...terms,classification:'Own',vehicleFreight:'0.00'},admin);
    const create=(body)=>S.post(t.id,V.validate(V.posting,{date:'2026-10-15',idempotencyKey:`own-test-${String(++n).padStart(10,'0')}`,...body}),admin);
    const adv=await create({kind:'driver_advance',amount:'10000.00'});
    const exp=await create({kind:'expense',amount:'20000.00',expenseHeadId:head.id});
    const adj=await create({kind:'driver_adjustment',amount:'10000.00',advanceId:adv.id,expenseId:exp.id});
    assert.equal(S.totals(await S.load(t.id)).totalExpenses,'20000.00');
    await assert.rejects(()=>create({kind:'driver_adjustment',amount:'1.00',advanceId:adv.id,expenseId:exp.id}),/unadjusted/);
    await assert.rejects(()=>S.reverse(t.id,'advance',adv.id,'Wrong entry',admin),/adjustments first/);
    await S.reverse(t.id,'entry',adj.id,'Wrong adjustment',admin);await S.reverse(t.id,'advance',adv.id,'Wrong advance',admin);
    assert.equal(S.totals(await S.load(t.id)).totalExpenses,'20000.00');
    const standalone = await S.vehicleExpense(own.id,V.validate(V.posting,{kind:'expense',amount:'500.00',expenseHeadId:head.id,date:'2026-10-15',idempotencyKey:'standalone-test-expense-001'}),admin);
    let pl=await R.report('vehicle-pl',V.validate(V.query,{}));assert.equal(pl.rows.find(r=>r.vehicleId===own.id).netProfit,'29500.00');
    await S.reverseVehicleExpense(own.id,standalone.id,'Wrong standalone cost',admin);
    pl=await R.report('vehicle-pl',V.validate(V.query,{}));assert.equal(pl.rows.find(r=>r.vehicleId===own.id).netProfit,'30000.00');
  });
  test('API authentication, RBAC, reports and original-route protections',async()=>{
    const headers={Authorization:`Bearer ${token}`,'Content-Type':'application/json'};
    assert.equal((await fetch(`${baseURL}/accounting/dashboard`)).status,401);
    const operator=await M.User.create({name:'Operator',email:'operator@example.com',password:'test-password',role:'Data Entry Operator'});
    const operatorToken=require('jsonwebtoken').sign({id:operator.id},process.env.JWT_SECRET || 'super_secret_tms_token_signing_key_2026_production_grade');
    assert.equal((await fetch(`${baseURL}/accounting/dashboard`,{headers:{Authorization:`Bearer ${operatorToken}`}})).status,403);
    for(const report of R.names){const response=await fetch(`${baseURL}/accounting/reports/${report}?startDate=2026-10-01&endDate=2026-10-31`,{headers});assert.equal(response.status,200,`${report}: ${await response.text()}`);}
    for (const resource of ['owners','vehicles','drivers','locations','parties','trips','expenses','diesels','income-logs','driver-advances']) {
      const response=await fetch(`${baseURL}/${resource}`,{headers});assert.equal(response.status,200,resource);
    }
    const legacyExpense=await M.Expense.create({expenseHeadId:head.id,amount:'10.00',date:'2026-10-15'});
    assert.equal((await fetch(`${baseURL}/expenses/${legacyExpense.id}`,{method:'DELETE',headers})).status,204);
    assert.ok((await M.Expense.unscoped().findByPk(legacyExpense.id)).voidedAt);
    assert.equal(await M.Expense.findByPk(legacyExpense.id),null);
    const dashboard=await fetch(`${baseURL}/accounting/dashboard`,{headers});assert.equal(dashboard.status,200);
    const loads=await fetch(`${baseURL}/accounting/loads`,{headers});assert.equal(loads.status,200);
    const detail=await fetch(`${baseURL}/accounting/loads/${trip.id}`,{headers});assert.equal(detail.status,200);
    const printResponse=await fetch(`${baseURL}/accounting/reports/settlements?format=print&limit=1`,{headers});assert.equal(printResponse.status,200);const printData=await printResponse.json();assert.equal(printData.data.length,printData.total);assert.ok(printData.total>1);
    const csv=await fetch(`${baseURL}/accounting/reports/owner-ledger?format=csv`,{headers});assert.equal(csv.status,200);assert.ok(csv.headers.get('content-type').includes('text/csv'));
    assert.equal((await fetch(`${baseURL}/trips/${trip.id}`,{method:'DELETE',headers})).status,409);
    assert.equal((await fetch(`${baseURL}/income-logs`,{method:'POST',headers,body:JSON.stringify({tripId:trip.id})})).status,409);
    assert.equal((await fetch(`${baseURL}/accounting/loads/${trip.id}/cancel`,{method:'POST',headers,body:JSON.stringify({reason:'Test cancellation'})})).status,400);
    const pod=await fetch(`${baseURL}/accounting/loads/${trip.id}/pod`,{method:'PUT',headers,body:JSON.stringify({podStatus:'Approved',podSubmissionDate:'2026-10-15',version:2})});assert.equal(pod.status,200,await pod.text());
    assert.equal(S.totals(await S.load(trip.id)).companyOutstanding,'21000.00');
  });
}
