const { Vehicle, Owner, Trip, Driver } = require('../models');
const crud = require('./crudController');
const { Op } = require('sequelize');

exports.getAllVehicles = crud.getAll(Vehicle, [{ model: Owner, as: 'owner' }], ['vehicleNumber', 'vehicleType']);
exports.getVehicle = crud.getOne(Vehicle, [{ model: Owner, as: 'owner' }]);
exports.createVehicle = crud.createOne(Vehicle);
exports.updateVehicle = crud.updateOne(Vehicle);
exports.deleteVehicle = crud.deleteOne(Vehicle);

// Expiry warnings for vehicle permits, fitness, pollution, and insurance certificates (within next 30 days or already expired)
exports.getExpiryAlerts = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const warningDays = new Date();
    warningDays.setDate(warningDays.getDate() + 30);
    const warningLimit = warningDays.toISOString().split('T')[0];

    const vehicles = await Vehicle.findAll({
      where: {
        status: 'Active',
        docAlertResponsibility: 'Admin',
        [Op.or]: [
          { insuranceExpiry: { [Op.lte]: warningLimit } },
          { fitnessExpiry: { [Op.lte]: warningLimit } },
          { permitExpiry: { [Op.lte]: warningLimit } },
          { nationalPermitExpiry: { [Op.lte]: warningLimit } },
          { pollutionExpiry: { [Op.lte]: warningLimit } }
        ]
      },
      include: [{ model: Owner, as: 'owner' }]
    });

    // Format alerts
    const alerts = [];
    vehicles.forEach(vehicle => {
      const issues = [];
      if (vehicle.insuranceExpiry && vehicle.insuranceExpiry <= warningLimit) {
        issues.push({ type: 'Insurance', date: vehicle.insuranceExpiry, expired: vehicle.insuranceExpiry < today });
      }
      if (vehicle.fitnessExpiry && vehicle.fitnessExpiry <= warningLimit) {
        issues.push({ type: 'Fitness', date: vehicle.fitnessExpiry, expired: vehicle.fitnessExpiry < today });
      }
      if (vehicle.permitExpiry && vehicle.permitExpiry <= warningLimit) {
        issues.push({ type: 'Permit', date: vehicle.permitExpiry, expired: vehicle.permitExpiry < today });
      }
      if (vehicle.nationalPermitExpiry && vehicle.nationalPermitExpiry <= warningLimit) {
        issues.push({ type: 'National Permit', date: vehicle.nationalPermitExpiry, expired: vehicle.nationalPermitExpiry < today });
      }
      if (vehicle.pollutionExpiry && vehicle.pollutionExpiry <= warningLimit) {
        issues.push({ type: 'Pollution', date: vehicle.pollutionExpiry, expired: vehicle.pollutionExpiry < today });
      }

      if (issues.length > 0) {
        alerts.push({
          id: vehicle.id,
          vehicleNumber: vehicle.vehicleNumber,
          ownerName: vehicle.owner ? vehicle.owner.name : 'Unknown',
          issues
        });
      }
    });

    res.status(200).json({
      status: 'success',
      count: alerts.length,
      data: alerts
    });
  } catch (error) {
    next(error);
  }
};

// Retrieve the last driver who drove this vehicle from the most recent trip
exports.getLastDriver = async (req, res, next) => {
  try {
    const { id } = req.params;
    const latestTrip = await Trip.findOne({
      where: { vehicleId: id },
      order: [['startDate', 'DESC'], ['id', 'DESC']],
      include: [{ model: Driver, as: 'driver', attributes: ['id', 'name', 'mobile'] }]
    });

    res.status(200).json({
      status: 'success',
      driver: latestTrip && latestTrip.driver ? latestTrip.driver : null
    });
  } catch (error) {
    next(error);
  }
};
