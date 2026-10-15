// Additive, resumable MySQL migration. MySQL DDL auto-commits; do not pretend it is transactional.
const { sequelize } = require('../config/database');
const models = require('../models');
const { TripAccount, AccountingEntry, AccountingAudit } = require('./models');
async function migrate() {
  const qi = sequelize.getQueryInterface();
  const tables = await qi.showAllTables();
  for (const name of ['Vehicles', 'Trips', 'Users', 'Owners', 'Expenses', 'IncomeLogs', 'DriverAdvances', 'Diesels']) {
    if (!tables.includes(name)) throw new Error(`Missing existing table ${name}; initialize the existing TMS schema first.`);
  }
  for (const Model of [models.Vehicle, models.Expense, models.IncomeLog, models.DriverAdvance, models.Diesel]) {
    const columns = await qi.describeTable(Model.tableName);
    const attributes = Model.getAttributes();
    const names = Model === models.Vehicle ? ['classification'] : Object.keys(require('./models').financialFields);
    for (const name of names) if (!columns[name]) await qi.addColumn(Model.tableName, name, attributes[name]);
    if (Model !== models.Vehicle) {
      const indexes = await qi.showIndex(Model.tableName);
      if (!indexes.some(i => i.name === `${Model.tableName}_accounting_request`)) await qi.addIndex(Model.tableName, ['idempotencyKey'], { unique: true, name: `${Model.tableName}_accounting_request` });
    }
  }
  for (const Model of [TripAccount, AccountingEntry, AccountingAudit]) await Model.sync();
  for (const name of ['Diesel / Petrol', 'FASTag / Toll', 'Driver Salary', 'Maintenance / Repairs', 'Tyres / Spare Parts', 'Insurance', 'Fitness / Permit', 'Challan', 'Loading / Unloading', 'Other Expenses']) {
    await models.ExpenseHead.findOrCreate({ where: { name }, defaults: { status: 'Active' } });
  }
  const incomeIndexes = await qi.showIndex('IncomeLogs');
  if (!incomeIndexes.some(i => i.name === 'IncomeLogs_payment_reference')) await qi.addIndex('IncomeLogs', ['paymentReference'], { unique: true, name: 'IncomeLogs_payment_reference' });
}
if (require.main === module) migrate().then(() => sequelize.close()).catch(async e => { console.error(e.message); await sequelize.close(); process.exitCode = 1; });
module.exports = migrate;
