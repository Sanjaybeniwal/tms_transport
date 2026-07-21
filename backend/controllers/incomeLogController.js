const { IncomeLog, Party, Trip } = require('../models');
const crud = require('./crudController');

const includes = [
  { model: Party, as: 'party', attributes: ['id', 'name'] },
  { model: Trip, as: 'trip', attributes: ['id', 'tripNumber', 'freightAmount', 'commission'] }
];

exports.getAllIncomeLogs = crud.getAll(IncomeLog, includes, ['remarks']);
exports.getIncomeLog = crud.getOne(IncomeLog, includes);
exports.createIncomeLog = crud.createOne(IncomeLog);
exports.updateIncomeLog = crud.updateOne(IncomeLog);
exports.deleteIncomeLog = crud.deleteOne(IncomeLog);
