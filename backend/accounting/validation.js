const Joi = require('joi');
const amount = Joi.string().pattern(/^\d{1,8}(\.\d{1,2})?$/);
const id = Joi.number().integer().positive();
const date = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).custom((value, helpers) => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value ? value : helpers.error('any.invalid');
});
const text = Joi.string().max(2000).allow('', null);
const link = Joi.string().uri({ scheme: ['https'] }).max(255).allow('', null);
const terms = Joi.object({
  classification: Joi.string().valid('Own', 'Market').required(),
  companyFreight: amount.required(), vehicleFreight: amount.default('0.00'), additionalIncome: amount.default('0.00'), companyDeduction: amount.default('0.00'), ownerDeduction: amount.default('0.00'), brokerDeduction: amount.default('0.00'), commissionExpense: amount.default('0.00'),
  companyReference: Joi.string().max(255).allow('', null), material: text, remarks: text,
  dueDate: date.required(), ownerDueDate: date.required(), podRequired: Joi.boolean().required(),
  version: id, reconcileLegacy: Joi.boolean().valid(true).required()
});
const posting = Joi.object({
  kind: Joi.string().valid('company_payment', 'owner_payment', 'owner_advance', 'expense', 'driver_advance', 'driver_adjustment').required(),
  amount: amount.required(), date: date.required(), paymentMethod: Joi.string().valid('Cash', 'UPI', 'Bank', 'Cheque').default('Cash'),
  paymentReference: Joi.string().max(150).allow('', null), remarks: text, recipient: Joi.string().max(255).allow('', null), attachment: link,
  expenseHeadId: id, advanceId: id, expenseId: id,
  idempotencyKey: Joi.string().min(16).max(100).required()
});
const pod = Joi.object({ podStatus: Joi.string().valid('Pending', 'Received', 'Approved').required(), podSubmissionDate: date.allow(null), podDocument: link, remarks: text, version: id.required() });
const query = Joi.object({
  startDate: date, endDate: date, vehicleId: id, partyId: id, ownerId: id, tripId: id,
  status: Joi.string().valid('Pending', 'Running', 'Completed', 'Cancelled'), classification: Joi.string().valid('Own', 'Market'),
  paymentStatus: Joi.string().valid('Unpaid', 'Partial', 'Paid'), ownerPaymentStatus: Joi.string().valid('Unpaid', 'Partial', 'Paid'), search: Joi.string().max(100).allow(''),
  page: id.default(1), limit: id.max(100).default(25), sortBy: Joi.string().max(50), sortOrder: Joi.string().valid('ASC', 'DESC').default('ASC'),
  format: Joi.string().valid('csv', 'print')
});
function validate(schema, body) {
  const result = schema.validate(body, { abortEarly: false, convert: true });
  if (result.error) { const AppError = require('../utils/appError'); throw new AppError(result.error.details.map(e => e.message).join('; '), 400); }
  return result.value;
}
module.exports = { terms, posting, pod, query, validate, date };
