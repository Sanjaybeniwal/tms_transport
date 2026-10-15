const { DataTypes: D } = require('sequelize');
const { sequelize } = require('../config/database');
const ref = (model, nullable = false) => ({ type: D.INTEGER, allowNull: nullable, references: { model, key: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' });
const cash = () => ({ type: D.DECIMAL(14, 2), allowNull: false, defaultValue: '0.00' });
const TripAccount = sequelize.define('TripAccount', {
  tripId: { ...ref('Trips'), unique: true },
  classification: { type: D.ENUM('Own', 'Market'), allowNull: false },
  ownerId: ref('Owners'),
  companyFreight: cash(), vehicleFreight: cash(), additionalIncome: cash(), companyDeduction: cash(), ownerDeduction: cash(), brokerDeduction: cash(), commissionExpense: cash(),
  companyReference: D.STRING, material: D.TEXT, remarks: D.TEXT,
  dueDate: { type: D.DATEONLY, allowNull: false }, ownerDueDate: { type: D.DATEONLY, allowNull: false },
  podRequired: { type: D.BOOLEAN, defaultValue: true, allowNull: false },
  podSubmissionDate: D.DATEONLY, podDocument: D.STRING,
  createdBy: ref('Users'), version: { type: D.INTEGER, allowNull: false, defaultValue: 1 }
}, { indexes: [{ fields: ['classification', 'dueDate'] }, { fields: ['ownerId'] }] });
const AccountingEntry = sequelize.define('AccountingEntry', {
  tripId: ref('Trips'),
  kind: { type: D.ENUM('owner_advance', 'owner_payment', 'driver_adjustment'), allowNull: false },
  amount: cash(), date: { type: D.DATEONLY, allowNull: false },
  paymentMethod: D.STRING, paymentReference: D.STRING, remarks: D.TEXT,
  advanceId: ref('DriverAdvances', true), expenseId: ref('Expenses', true),
  idempotencyKey: { type: D.STRING(100), allowNull: false, unique: true },
  requestHash: { type: D.STRING(64), allowNull: false },
  createdBy: ref('Users'), voidedAt: D.DATE, voidReason: D.TEXT
}, { indexes: [{ fields: ['tripId', 'date'] }, { unique: true, fields: ['paymentReference'] }] });
const AccountingAudit = sequelize.define('AccountingAudit', {
  entity: { type: D.STRING, allowNull: false }, entityId: { type: D.INTEGER, allowNull: false },
  action: { type: D.STRING, allowNull: false }, before: D.JSON, after: D.JSON,
  createdBy: ref('Users')
}, { updatedAt: false, indexes: [{ fields: ['entity', 'entityId', 'createdAt'] }] });
// Existing financial resources are reused. New fields are additive and nullable for legacy data.
const financialFields = {
  createdBy: ref('Users', true), voidedAt: { type: D.DATE }, voidReason: { type: D.TEXT },
  idempotencyKey: { type: D.STRING(100), unique: true }, requestHash: { type: D.STRING(64) },
  paymentMethod: { type: D.STRING }, paymentReference: { type: D.STRING }, recipient: { type: D.STRING }, attachment: { type: D.STRING }
};
const install = models => {
  models.Vehicle.rawAttributes.classification = { type: D.ENUM('Unclassified', 'Own', 'Market'), allowNull: false, defaultValue: 'Unclassified' };
  models.Vehicle.refreshAttributes();
  for (const name of ['Expense', 'IncomeLog', 'DriverAdvance', 'Diesel']) {
    Object.assign(models[name].rawAttributes, financialFields);
    models[name].refreshAttributes();
    models[name].addScope('defaultScope', { where: { voidedAt: null } }, { override: true });
  }
  models.Trip.hasOne(TripAccount, { foreignKey: 'tripId', as: 'account' });
  TripAccount.belongsTo(models.Trip, { foreignKey: 'tripId', as: 'trip' });
};
module.exports = { TripAccount, AccountingEntry, AccountingAudit, financialFields, install };
