const { Location } = require('../models');
const crud = require('./crudController');

exports.getAllLocations = crud.getAll(Location, [], ['name', 'city', 'state']);
exports.getLocation = crud.getOne(Location);
exports.createLocation = crud.createOne(Location);
exports.updateLocation = crud.updateOne(Location);
exports.deleteLocation = crud.deleteOne(Location);
