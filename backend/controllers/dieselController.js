const { Diesel, Vehicle, Pump, Driver, Trip } = require('../models');
const crud = require('./crudController');

const includes = [
  { model: Vehicle, as: 'vehicle', attributes: ['id', 'vehicleNumber'] },
  { model: Pump, as: 'pump', attributes: ['id', 'name'] },
  { model: Driver, as: 'driver', attributes: ['id', 'name'] },
  { model: Trip, as: 'trip', attributes: ['id', 'tripNumber'] }
];

exports.getAllDiesels = crud.getAll(Diesel, includes);
exports.getDiesel = crud.getOne(Diesel, includes);
exports.createDiesel = crud.createOne(Diesel);
exports.updateDiesel = crud.updateOne(Diesel);
exports.deleteDiesel = crud.deleteOne(Diesel);
