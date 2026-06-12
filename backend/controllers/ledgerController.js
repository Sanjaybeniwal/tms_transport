const { Diesel, PumpPayment, Pump, Vehicle, Owner, Trip, IncomeLog, Expense, Driver, DriverAdvance, Party } = require('../models');
const { Op } = require('sequelize');
const AppError = require('../utils/appError');

// Date Range Filter Helper
const getDateFilter = (startDate, endDate, dateField = 'date') => {
  const filter = {};
  if (startDate && endDate) {
    filter[dateField] = { [Op.between]: [startDate, endDate] };
  } else if (startDate) {
    filter[dateField] = { [Op.gte]: startDate };
  } else if (endDate) {
    filter[dateField] = { [Op.lte]: endDate };
  }
  return filter;
};

// 1. Vehicle Wise Ledger
exports.getVehicleLedger = async (req, res, next) => {
  try {
    const { vehicleId } = req.params;
    const { startDate, endDate } = req.query;

    const dateFilter = getDateFilter(startDate, endDate, 'date');
    const tripDateFilter = getDateFilter(startDate, endDate, 'startDate');

    let vehicle;
    let diesels;
    let expenses;
    let trips;

    if (vehicleId === 'all') {
      vehicle = { id: 'all', vehicleNumber: 'All Vehicles', vehicleType: 'All' };

      diesels = await Diesel.findAll({
        where: { ...dateFilter },
        include: [{ model: Pump, as: 'pump', attributes: ['name'] }]
      });

      expenses = await Expense.findAll({
        where: { ...dateFilter },
        include: ['expenseHead']
      });

      trips = await Trip.findAll({
        where: { ...tripDateFilter }
      });
    } else {
      vehicle = await Vehicle.findByPk(vehicleId);
      if (!vehicle) return next(new AppError('Vehicle not found', 404));

      diesels = await Diesel.findAll({
        where: { vehicleId, ...dateFilter },
        include: [{ model: Pump, as: 'pump', attributes: ['name'] }]
      });

      expenses = await Expense.findAll({
        where: { vehicleId, ...dateFilter },
        include: ['expenseHead']
      });

      trips = await Trip.findAll({
        where: { vehicleId, ...tripDateFilter }
      });
    }

    const tripIds = trips.map(t => t.id);

    // Advances
    let advances = [];
    if (tripIds.length > 0) {
      advances = await DriverAdvance.findAll({
        where: { tripId: { [Op.in]: tripIds } },
        include: [{ model: Driver, as: 'driver', attributes: ['name'] }]
      });
    }

    // Income
    let incomes = [];
    if (tripIds.length > 0) {
      incomes = await IncomeLog.findAll({
        where: { tripId: { [Op.in]: tripIds } }
      });
    }

    const totalDiesel = diesels.reduce((acc, curr) => acc + parseFloat(curr.totalAmount || 0), 0);
    const totalExpenses = expenses.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
    const totalAdvances = advances.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
    const totalIncome = incomes.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
    const profit = totalIncome - (totalDiesel + totalExpenses);

    res.status(200).json({
      status: 'success',
      data: {
        vehicle,
        summary: {
          totalDiesel: totalDiesel.toFixed(2),
          totalExpenses: totalExpenses.toFixed(2),
          totalAdvances: totalAdvances.toFixed(2),
          totalIncome: totalIncome.toFixed(2),
          profit: profit.toFixed(2)
        },
        diesels,
        expenses,
        advances,
        incomes
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Owner Wise Ledger
exports.getOwnerLedger = async (req, res, next) => {
  try {
    const { ownerId } = req.params;
    const { startDate, endDate } = req.query;

    const dateFilter = getDateFilter(startDate, endDate, 'date');
    const tripDateFilter = getDateFilter(startDate, endDate, 'startDate');

    let owner;
    let vehicles;

    if (ownerId === 'all') {
      owner = { id: 'all', name: 'All Owners' };
      vehicles = await Vehicle.findAll();
    } else {
      owner = await Owner.findByPk(ownerId);
      if (!owner) return next(new AppError('Owner not found', 404));
      vehicles = await Vehicle.findAll({ where: { ownerId } });
    }

    const vehicleIds = vehicles.map(v => v.id);

    let totalDiesel = 0;
    let totalExpenses = 0;
    let totalIncome = 0;

    if (vehicleIds.length > 0) {
      totalDiesel = await Diesel.sum('totalAmount', { where: { vehicleId: { [Op.in]: vehicleIds }, ...dateFilter } }) || 0;
      totalExpenses = await Expense.sum('amount', { where: { vehicleId: { [Op.in]: vehicleIds }, ...dateFilter } }) || 0;

      const trips = await Trip.findAll({ where: { vehicleId: { [Op.in]: vehicleIds }, ...tripDateFilter } });
      const tripIds = trips.map(t => t.id);
      if (tripIds.length > 0) {
        totalIncome = await IncomeLog.sum('amount', { where: { tripId: { [Op.in]: tripIds } } }) || 0;
      }
    }

    const netProfit = parseFloat(totalIncome) - (parseFloat(totalDiesel) + parseFloat(totalExpenses));

    res.status(200).json({
      status: 'success',
      data: {
        owner,
        vehicles: vehicles.map(v => ({ id: v.id, vehicleNumber: v.vehicleNumber })),
        summary: {
          totalIncome: parseFloat(totalIncome).toFixed(2),
          totalDiesel: parseFloat(totalDiesel).toFixed(2),
          totalExpenses: parseFloat(totalExpenses).toFixed(2),
          totalCost: (parseFloat(totalDiesel) + parseFloat(totalExpenses)).toFixed(2),
          netProfit: netProfit.toFixed(2)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Driver Ledger
exports.getDriverLedger = async (req, res, next) => {
  try {
    const { driverId } = req.params;
    const { startDate, endDate } = req.query;

    const dateFilter = getDateFilter(startDate, endDate, 'date');

    let driver;
    let trips;
    let advances;
    let baseSalary = 0;

    if (driverId === 'all') {
      driver = { id: 'all', name: 'All Drivers', salary: 0 };

      trips = await Trip.findAll({
        where: { ...getDateFilter(startDate, endDate, 'startDate') },
        include: [{ model: Vehicle, as: 'vehicle', attributes: ['vehicleNumber'] }]
      });

      advances = await DriverAdvance.findAll({
        where: { ...dateFilter },
        include: [{ model: Trip, as: 'trip', attributes: ['tripNumber'] }]
      });

      const allDrivers = await Driver.findAll();
      baseSalary = allDrivers.reduce((acc, d) => acc + parseFloat(d.salary || 0), 0);
    } else {
      driver = await Driver.findByPk(driverId);
      if (!driver) return next(new AppError('Driver not found', 404));

      trips = await Trip.findAll({
        where: { driverId, ...getDateFilter(startDate, endDate, 'startDate') },
        include: [{ model: Vehicle, as: 'vehicle', attributes: ['vehicleNumber'] }]
      });

      advances = await DriverAdvance.findAll({
        where: { driverId, ...dateFilter },
        include: [{ model: Trip, as: 'trip', attributes: ['tripNumber'] }]
      });

      baseSalary = parseFloat(driver.salary || 0);
    }

    const totalAdvances = advances.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
    const balanceDue = baseSalary - totalAdvances;

    res.status(200).json({
      status: 'success',
      data: {
        driver,
        summary: {
          baseSalary: baseSalary.toFixed(2),
          totalAdvances: totalAdvances.toFixed(2),
          balanceDue: balanceDue.toFixed(2)
        },
        trips,
        advances
      }
    });
  } catch (error) {
    next(error);
  }
};

// 4. Party Ledger
exports.getPartyLedger = async (req, res, next) => {
  try {
    const { partyId } = req.params;
    const { startDate, endDate } = req.query;

    let party;
    let tripFilter;
    let incomeFilter;

    if (partyId === 'all') {
      party = { id: 'all', name: 'All Parties' };
      tripFilter = { ...getDateFilter(startDate, endDate, 'startDate') };
      incomeFilter = { ...getDateFilter(startDate, endDate, 'date') };
    } else {
      party = await Party.findByPk(partyId);
      if (!party) return next(new AppError('Party not found', 404));
      tripFilter = { partyId, ...getDateFilter(startDate, endDate, 'startDate') };
      incomeFilter = { partyId, ...getDateFilter(startDate, endDate, 'date') };
    }

    const trips = await Trip.findAll({
      where: tripFilter,
      include: [{ model: Vehicle, as: 'vehicle', attributes: ['vehicleNumber'] }]
    });

    const incomes = await IncomeLog.findAll({
      where: incomeFilter,
      include: [{ model: Trip, as: 'trip', attributes: ['tripNumber'] }]
    });

    const totalFreight = trips.reduce((acc, curr) => acc + parseFloat(curr.freightAmount || 0), 0);
    const totalReceived = incomes.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
    const outstanding = totalFreight - totalReceived;

    res.status(200).json({
      status: 'success',
      data: {
        party,
        summary: {
          totalFreight: totalFreight.toFixed(2),
          totalReceived: totalReceived.toFixed(2),
          outstanding: outstanding.toFixed(2)
        },
        trips,
        incomes
      }
    });
  } catch (error) {
    next(error);
  }
};

// 5. Pump Ledger
exports.getPumpLedger = async (req, res, next) => {
  try {
    const { pumpId } = req.params;
    const { startDate, endDate } = req.query;

    const dateFilter = getDateFilter(startDate, endDate, 'date');

    let pump;
    let diesels;
    let payments;
    let openingBalance = 0;

    if (pumpId === 'all') {
      const allPumps = await Pump.findAll();
      openingBalance = allPumps.reduce((acc, p) => acc + parseFloat(p.openingBalance || 0), 0);

      pump = {
        id: 'all',
        name: 'All Pumps',
        openingBalance,
        createdAt: allPumps.length > 0 ? allPumps[0].createdAt : new Date()
      };

      diesels = await Diesel.findAll({
        where: { ...dateFilter },
        include: [{ model: Vehicle, as: 'vehicle', attributes: ['vehicleNumber'] }]
      });

      payments = await PumpPayment.findAll({
        where: { ...dateFilter }
      });
    } else {
      pump = await Pump.findByPk(pumpId);
      if (!pump) return next(new AppError('Pump not found', 404));
      openingBalance = parseFloat(pump.openingBalance || 0);

      diesels = await Diesel.findAll({
        where: { pumpId, ...dateFilter },
        include: [{ model: Vehicle, as: 'vehicle', attributes: ['vehicleNumber'] }]
      });

      payments = await PumpPayment.findAll({
        where: { pumpId, ...dateFilter }
      });
    }

    const totalDieselPurchased = diesels.reduce((acc, curr) => acc + parseFloat(curr.totalAmount || 0), 0);
    const totalPayment = payments.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
    const outstandingBalance = openingBalance + totalDieselPurchased - totalPayment;

    // Combine logs to create a chronological running balance history
    const history = [];

    // Add opening balance
    history.push({
      date: pump.createdAt ? new Date(pump.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      type: 'Opening Balance',
      reference: 'N/A',
      debit: openingBalance > 0 ? openingBalance : 0,
      credit: openingBalance < 0 ? Math.abs(openingBalance) : 0,
      runningBalance: openingBalance
    });

    // Map diesels (debits: increases outstanding amount due)
    diesels.forEach(d => {
      history.push({
        id: d.id,
        date: d.date,
        type: 'Diesel Fuel Purchase',
        reference: `Qty: ${d.quantity}L @ Rate: ${d.rate} (${d.vehicle ? d.vehicle.vehicleNumber : 'N/A'})`,
        debit: parseFloat(d.totalAmount || 0),
        credit: 0,
        rawDate: new Date(d.date)
      });
    });

    // Map payments (credits: reduces outstanding amount due)
    payments.forEach(p => {
      history.push({
        id: p.id,
        date: p.date,
        type: 'Payment Made',
        reference: `${p.paymentMethod} (Txn: ${p.transactionNumber || 'N/A'})`,
        debit: 0,
        credit: parseFloat(p.amount || 0),
        rawDate: new Date(p.date)
      });
    });

    // Sort chronologically
    const sortedTransactions = history.slice(1).sort((a, b) => a.rawDate - b.rawDate);

    // Recompute Running Balance
    let balance = openingBalance;
    const finalHistory = [history[0]];
    
    sortedTransactions.forEach(tx => {
      balance = balance + tx.debit - tx.credit;
      tx.runningBalance = balance;
      finalHistory.push(tx);
    });

    res.status(200).json({
      status: 'success',
      data: {
        pump,
        summary: {
          openingBalance: openingBalance.toFixed(2),
          totalDieselPurchased: totalDieselPurchased.toFixed(2),
          totalPayment: totalPayment.toFixed(2),
          outstandingBalance: outstandingBalance.toFixed(2)
        },
        history: finalHistory
      }
    });
  } catch (error) {
    next(error);
  }
};
