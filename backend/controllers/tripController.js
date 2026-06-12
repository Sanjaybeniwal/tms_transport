const { Trip, Vehicle, Driver, Location, Party } = require('../models');
const crud = require('./crudController');

const includes = [
  { model: Vehicle, as: 'vehicle', attributes: ['id', 'vehicleNumber', 'vehicleType'] },
  { model: Driver, as: 'driver', attributes: ['id', 'name', 'mobile'] },
  { model: Location, as: 'fromLocation', attributes: ['id', 'name', 'city', 'state'] },
  { model: Location, as: 'toLocation', attributes: ['id', 'name', 'city', 'state'] },
  { model: Party, as: 'party', attributes: ['id', 'name'] }
];

exports.getAllTrips = crud.getAll(Trip, includes, ['tripNumber']);
exports.getTrip = crud.getOne(Trip, includes);
exports.createTrip = crud.createOne(Trip);
exports.updateTrip = crud.updateOne(Trip);
exports.deleteTrip = crud.deleteOne(Trip);
