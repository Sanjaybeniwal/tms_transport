const { DriverAdvance, Driver, Trip } = require('../models');
const crud = require('./crudController');

const includes = [
  { model: Driver, as: 'driver', attributes: ['id', 'name', 'mobile'] },
  { model: Trip, as: 'trip', attributes: ['id', 'tripNumber'] }
];

exports.getAllDriverAdvances = crud.getAll(DriverAdvance, includes, ['remarks']);
exports.getDriverAdvance = crud.getOne(DriverAdvance, includes);
exports.createDriverAdvance = crud.createOne(DriverAdvance);
exports.updateDriverAdvance = crud.updateOne(DriverAdvance);
exports.deleteDriverAdvance = crud.deleteOne(DriverAdvance);
