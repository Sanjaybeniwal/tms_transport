const { Driver, Trip, Vehicle, Location, Party } = require('../models');
const crud = require('./crudController');
const { Op } = require('sequelize');

exports.getAllDrivers = crud.getAll(Driver, [], ['name', 'mobile', 'licenseNumber']);
exports.getDriver = crud.getOne(Driver);
exports.createDriver = crud.createOne(Driver);
exports.updateDriver = crud.updateOne(Driver);
exports.deleteDriver = crud.deleteOne(Driver);

// Get Driver history (associated trips)
exports.getDriverHistory = async (req, res, next) => {
  try {
    const driverId = req.params.id;
    const driver = await Driver.findByPk(driverId);
    if (!driver) {
      return res.status(404).json({ status: 'fail', message: 'Driver not found' });
    }

    const trips = await Trip.findAll({
      where: { driverId },
      include: [
        { model: Vehicle, as: 'vehicle', attributes: ['vehicleNumber', 'vehicleType'] },
        { model: Location, as: 'fromLocation', attributes: ['city', 'state'] },
        { model: Location, as: 'toLocation', attributes: ['city', 'state'] },
        { model: Party, as: 'party', attributes: ['name'] }
      ],
      order: [['startDate', 'DESC']]
    });

    res.status(200).json({
      status: 'success',
      count: trips.length,
      data: {
        driver,
        trips
      }
    });
  } catch (error) {
    next(error);
  }
};

// License Expiry Alerts for drivers (within 30 days or already expired)
exports.getLicenseAlerts = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const warningDays = new Date();
    warningDays.setDate(warningDays.getDate() + 30);
    const warningLimit = warningDays.toISOString().split('T')[0];

    const drivers = await Driver.findAll({
      where: {
        status: 'Active',
        licenseExpiry: { [Op.lte]: warningLimit }
      }
    });

    const alerts = drivers.map(driver => ({
      id: driver.id,
      name: driver.name,
      mobile: driver.mobile,
      licenseNumber: driver.licenseNumber,
      licenseExpiry: driver.licenseExpiry,
      expired: driver.licenseExpiry < today
    }));

    res.status(200).json({
      status: 'success',
      count: alerts.length,
      data: alerts
    });
  } catch (error) {
    next(error);
  }
};
