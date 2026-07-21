const { Trip, Vehicle, Driver, Location, Party } = require('../models');
const crud = require('./crudController');

const includes = [
  { model: Vehicle, as: 'vehicle', attributes: ['id', 'vehicleNumber', 'vehicleType'] },
  { model: Driver, as: 'driver', attributes: ['id', 'name', 'mobile'] },
  { model: Location, as: 'fromLocation', attributes: ['id', 'name', 'city', 'state'] },
  { model: Location, as: 'toLocation', attributes: ['id', 'name', 'city', 'state'] },
  { model: Party, as: 'party', attributes: ['id', 'name'] }
];

const resolveDriverXYZ = async (req) => {
  if (req.body && (req.body.driverId === 'static-xyz' || !req.body.driverId)) {
    const [driver] = await Driver.findOrCreate({
      where: { name: 'XYZ' },
      defaults: {
        mobile: '9999999999',
        address: 'Default Address for XYZ',
        licenseNumber: 'DL-XYZ-99999',
        licenseExpiry: '2035-12-31',
        joiningDate: '2026-07-21',
        salary: 20000.00,
        status: 'Active'
      }
    });
    req.body.driverId = driver.id;
  }
};

exports.getAllTrips = crud.getAll(Trip, includes, ['tripNumber']);
exports.getTrip = crud.getOne(Trip, includes);

exports.createTrip = async (req, res, next) => {
  try {
    await resolveDriverXYZ(req);
    return crud.createOne(Trip)(req, res, next);
  } catch (err) {
    next(err);
  }
};

exports.updateTrip = async (req, res, next) => {
  try {
    await resolveDriverXYZ(req);
    return crud.updateOne(Trip)(req, res, next);
  } catch (err) {
    next(err);
  }
};

exports.deleteTrip = crud.deleteOne(Trip);
