const { Owner, Vehicle, Trip, IncomeLog, Expense, Diesel, Driver } = require('../models');
const crud = require('./crudController');
const { Op } = require('sequelize');
const AppError = require('../utils/appError');

exports.getAllOwners = crud.getAll(Owner, [], ['name', 'mobile']);
exports.getOwner = crud.getOne(Owner);
exports.createOwner = crud.createOne(Owner);
exports.updateOwner = crud.updateOne(Owner);
exports.deleteOwner = crud.deleteOne(Owner);

exports.getOwnerDetails = async (req, res, next) => {
  try {
    const ownerId = req.params.id;
    const owner = await Owner.findByPk(ownerId);
    if (!owner) {
      return next(new AppError('Owner not found', 404));
    }

    // 1. Get vehicles
    const vehicles = await Vehicle.findAll({ where: { ownerId } });
    const vehicleIds = vehicles.map(v => v.id);

    // 2. Get trips
    let trips = [];
    if (vehicleIds.length > 0) {
      trips = await Trip.findAll({
        where: { vehicleId: { [Op.in]: vehicleIds } },
        include: [
          { model: Vehicle, as: 'vehicle' },
          { model: Driver, as: 'driver' }
        ]
      });
    }

    const tripIds = trips.map(t => t.id);
    const activeTripsCount = trips.filter(t => t.status === 'Running' || t.status === 'Pending').length;

    // 3. Financial aggregates
    let totalIncome = 0;
    let dieselExpense = 0;
    let otherExpense = 0;

    if (tripIds.length > 0) {
      totalIncome = await IncomeLog.sum('amount', { where: { tripId: { [Op.in]: tripIds } } }) || 0;
    }

    if (vehicleIds.length > 0) {
      dieselExpense = await Diesel.sum('totalAmount', { where: { vehicleId: { [Op.in]: vehicleIds } } }) || 0;
      otherExpense = await Expense.sum('amount', { where: { vehicleId: { [Op.in]: vehicleIds } } }) || 0;
    }

    const totalExpense = parseFloat(dieselExpense) + parseFloat(otherExpense);
    const profitLoss = parseFloat(totalIncome) - totalExpense;

    res.status(200).json({
      status: 'success',
      data: {
        owner,
        totalVehicles: vehicles.length,
        vehicles: vehicles.map(v => ({ id: v.id, vehicleNumber: v.vehicleNumber, type: v.vehicleType, status: v.status })),
        activeTripsCount,
        financials: {
          totalIncome: parseFloat(totalIncome).toFixed(2),
          dieselExpense: parseFloat(dieselExpense).toFixed(2),
          otherExpense: parseFloat(otherExpense).toFixed(2),
          totalExpense: totalExpense.toFixed(2),
          profitLoss: profitLoss.toFixed(2)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
