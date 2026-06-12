const { PumpPayment, Pump } = require('../models');
const crud = require('./crudController');

const includes = [
  { model: Pump, as: 'pump', attributes: ['id', 'name'] }
];

exports.getAllPumpPayments = crud.getAll(PumpPayment, includes, ['transactionNumber', 'remarks']);
exports.getPumpPayment = crud.getOne(PumpPayment, includes);
exports.createPumpPayment = crud.createOne(PumpPayment);
exports.updatePumpPayment = crud.updateOne(PumpPayment);
exports.deletePumpPayment = crud.deleteOne(PumpPayment);
