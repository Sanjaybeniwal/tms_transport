const { Trip, Vehicle, Driver, Party, Diesel, Expense, Pump, IncomeLog, Owner, ExpenseHead, Location, DriverAdvance } = require('../models');
const { Op } = require('sequelize');

// Helper to filter dates
const dateRangeFilter = (startDate, endDate, field = 'date') => {
  if (startDate && endDate) {
    return { [field]: { [Op.between]: [startDate, endDate] } };
  }
  if (startDate) {
    return { [field]: { [Op.gte]: startDate } };
  }
  if (endDate) {
    return { [field]: { [Op.lte]: endDate } };
  }
  return {};
};

// 1. Vehicle Report
exports.getVehicleReport = async (req, res, next) => {
  try {
    const { status, ownerId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (ownerId) where.ownerId = ownerId;

    const vehicles = await Vehicle.findAll({
      where,
      include: [{ model: Owner, as: 'owner', attributes: ['name', 'mobile'] }]
    });

    res.status(200).json({ status: 'success', data: vehicles });
  } catch (error) {
    next(error);
  }
};

// 2. Owner Report
exports.getOwnerReport = async (req, res, next) => {
  try {
    const owners = await Owner.findAll({
      include: [{ model: Vehicle, as: 'vehicles', attributes: ['vehicleNumber'] }]
    });
    res.status(200).json({ status: 'success', data: owners });
  } catch (error) {
    next(error);
  }
};

// 3. Driver Report
exports.getDriverReport = async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;

    const drivers = await Driver.findAll({ where });
    res.status(200).json({ status: 'success', data: drivers });
  } catch (error) {
    next(error);
  }
};

// 4. Trip Report
exports.getTripReport = async (req, res, next) => {
  try {
    const { startDate, endDate, status, partyId } = req.query;
    const where = {
      ...dateRangeFilter(startDate, endDate, 'startDate')
    };
    if (status) where.status = status;
    if (partyId) where.partyId = partyId;

    const trips = await Trip.findAll({
      where,
      include: [
        { model: Vehicle, as: 'vehicle', attributes: ['vehicleNumber'] },
        { model: Driver, as: 'driver', attributes: ['name'] },
        { model: Party, as: 'party', attributes: ['name'] }
      ]
    });

    res.status(200).json({ status: 'success', data: trips });
  } catch (error) {
    next(error);
  }
};

// 5. Expense Report
exports.getExpenseReport = async (req, res, next) => {
  try {
    const { startDate, endDate, expenseHeadId } = req.query;
    const where = {
      ...dateRangeFilter(startDate, endDate, 'date')
    };
    if (expenseHeadId) where.expenseHeadId = expenseHeadId;

    const expenses = await Expense.findAll({
      where,
      include: [
        { model: ExpenseHead, as: 'expenseHead', attributes: ['name'] },
        { model: Vehicle, as: 'vehicle', attributes: ['vehicleNumber'] }
      ]
    });

    res.status(200).json({ status: 'success', data: expenses });
  } catch (error) {
    next(error);
  }
};

// 6. Diesel Report
exports.getDieselReport = async (req, res, next) => {
  try {
    const { startDate, endDate, pumpId, vehicleId } = req.query;
    const where = {
      ...dateRangeFilter(startDate, endDate, 'date')
    };
    if (pumpId) where.pumpId = pumpId;
    if (vehicleId) where.vehicleId = vehicleId;

    const diesels = await Diesel.findAll({
      where,
      include: [
        { model: Pump, as: 'pump', attributes: ['name'] },
        { model: Vehicle, as: 'vehicle', attributes: ['vehicleNumber'] },
        { model: Driver, as: 'driver', attributes: ['name'] }
      ]
    });

    res.status(200).json({ status: 'success', data: diesels });
  } catch (error) {
    next(error);
  }
};

// 7. Pump Report
exports.getPumpReport = async (req, res, next) => {
  try {
    const pumps = await Pump.findAll();
    const result = [];

    for (let pump of pumps) {
      const fuelTotal = await Diesel.sum('totalAmount', { where: { pumpId: pump.id } }) || 0;
      const paymentTotal = await PumpPayment.sum('amount', { where: { pumpId: pump.id } }) || 0;
      const outstanding = parseFloat(pump.openingBalance) + parseFloat(fuelTotal) - parseFloat(paymentTotal);

      result.push({
        id: pump.id,
        name: pump.name,
        contactPerson: pump.contactPerson,
        mobile: pump.mobile,
        openingBalance: parseFloat(pump.openingBalance).toFixed(2),
        totalDieselPurchased: parseFloat(fuelTotal).toFixed(2),
        totalPayments: parseFloat(paymentTotal).toFixed(2),
        outstandingBalance: outstanding.toFixed(2),
        status: pump.status
      });
    }

    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

// 8. Income Report
exports.getIncomeReport = async (req, res, next) => {
  try {
    const { startDate, endDate, partyId } = req.query;
    const where = {
      ...dateRangeFilter(startDate, endDate, 'date')
    };
    if (partyId) where.partyId = partyId;

    const incomes = await IncomeLog.findAll({
      where,
      include: [
        { model: Party, as: 'party', attributes: ['name'] },
        { model: Trip, as: 'trip', attributes: ['tripNumber', 'freightAmount', 'commission'] }
      ]
    });

    res.status(200).json({ status: 'success', data: incomes });
  } catch (error) {
    next(error);
  }
};

// 9. Profit & Loss Report
exports.getProfitLossReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = dateRangeFilter(startDate, endDate, 'date');
    const tripFilter = dateRangeFilter(startDate, endDate, 'startDate');

    // 1. Total Income
    const incomeTotal = await IncomeLog.sum('amount', { where: dateFilter }) || 0;

    // 2. Total Commission
    const commissionTotal = await Trip.sum('commission', { where: tripFilter }) || 0;

    // 3. Diesel Expenses
    const dieselTotal = await Diesel.sum('totalAmount', { where: dateFilter }) || 0;

    // 4. Other Expenses grouped by Expense Head
    const otherExpenses = await Expense.findAll({
      where: dateFilter,
      include: [{ model: ExpenseHead, as: 'expenseHead', attributes: ['name'] }]
    });

    const expensesGrouped = {};
    otherExpenses.forEach(exp => {
      const headName = exp.expenseHead ? exp.expenseHead.name : 'Uncategorized';
      if (!expensesGrouped[headName]) {
        expensesGrouped[headName] = 0;
      }
      expensesGrouped[headName] += parseFloat(exp.amount);
    });

    const totalOtherExpense = otherExpenses.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    const totalExpense = parseFloat(dieselTotal) + totalOtherExpense;
    const netProfit = parseFloat(incomeTotal) - totalExpense;

    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          totalIncome: parseFloat(incomeTotal).toFixed(2),
          totalCommission: parseFloat(commissionTotal).toFixed(2),
          dieselExpense: parseFloat(dieselTotal).toFixed(2),
          otherExpenses: totalOtherExpense.toFixed(2),
          totalExpense: totalExpense.toFixed(2),
          netProfit: netProfit.toFixed(2)
        },
        expensesBreakdown: Object.keys(expensesGrouped).map(name => ({
          headName: name,
          amount: expensesGrouped[name].toFixed(2)
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Mock Export PDF/Excel endpoint - in production this would stream a file, here we return success metadata
exports.exportReport = async (req, res, next) => {
  try {
    const { reportType, format } = req.query; // format = pdf | excel
    res.status(200).json({
      status: 'success',
      message: `Successfully generated ${reportType} report in ${format.toUpperCase()} format.`,
      downloadUrl: `http://localhost:5000/api/reports/download/mock_${reportType}_report.${format}`
    });
  } catch (error) {
    next(error);
  }
};

// 10. Driver & Vehicle Profit/Loss Report
exports.getDriverVehiclePLReport = async (req, res, next) => {
  try {
    const { startDate, endDate, driverId, vehicleId, partyId, status, tripId } = req.query;

    const tripWhere = {
      ...dateRangeFilter(startDate, endDate, 'startDate')
    };
    if (driverId) tripWhere.driverId = driverId;
    if (vehicleId) tripWhere.vehicleId = vehicleId;
    if (partyId) tripWhere.partyId = partyId;
    if (status) tripWhere.status = status;
    if (tripId) tripWhere.id = tripId;

    // Fetch all matching trips
    const trips = await Trip.findAll({
      where: tripWhere,
      include: [
        { model: Vehicle, as: 'vehicle', attributes: ['id', 'vehicleNumber'] },
        { model: Driver, as: 'driver', attributes: ['id', 'name'] },
        { model: Party, as: 'party', attributes: ['id', 'name'] },
        { model: Location, as: 'fromLocation', attributes: ['id', 'name'] },
        { model: Location, as: 'toLocation', attributes: ['id', 'name'] },
        { model: Diesel, as: 'diesels', attributes: ['id', 'totalAmount'] },
        { model: DriverAdvance, as: 'advances', attributes: ['id', 'amount'] },
        { 
          model: Expense, 
          as: 'expenses', 
          include: [{ model: ExpenseHead, as: 'expenseHead', attributes: ['name'] }] 
        }
      ],
      order: [['startDate', 'DESC'], ['id', 'DESC']]
    });

    // Helper functions for categorizing expenses
    const isToll = (name) => /toll/i.test(name);
    const isSalary = (name) => /salary|bhatta|allowance/i.test(name);
    const isLoading = (name) => /load|unload/i.test(name);
    const isMaintenance = (name) => /repair|tyre|maintenance/i.test(name);
    const isDiesel = (name) => /diesel/i.test(name);

    // 1. Process Trip-by-Trip (Driver-wise detailed)
    const tripRows = trips.map(t => {
      const freight = parseFloat(t.freightAmount || 0);
      const fuel = t.diesels.reduce((acc, curr) => acc + parseFloat(curr.totalAmount || 0), 0);
      const adv = t.advances.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);

      let toll = 0;
      let allowance = 0;
      let loading = 0;
      let maintenance = 0;
      let other = 0;

      t.expenses.forEach(e => {
        const headName = e.expenseHead?.name || '';
        const amt = parseFloat(e.amount || 0);

        if (isToll(headName)) {
          toll += amt;
        } else if (isSalary(headName)) {
          allowance += amt;
        } else if (isLoading(headName)) {
          loading += amt;
        } else if (isMaintenance(headName)) {
          maintenance += amt;
        } else if (isDiesel(headName)) {
          // ignore
        } else {
          other += amt;
        }
      });

      const totalExpenses = fuel + allowance + adv + toll + loading + maintenance + other;
      const profitLoss = freight - totalExpenses;

      // Settlement Calculations
      const isCompleted = t.status === 'Completed';
      const settlementAmount = isCompleted ? Math.max(0, allowance - adv) : 0;
      const remainingBalance = isCompleted ? 0 : (allowance - adv);
      const paymentStatus = isCompleted ? 'Settled' : 'Pending';

      return {
        id: t.id,
        tripNumber: t.tripNumber,
        startDate: t.startDate,
        endDate: t.endDate,
        status: t.status,
        vehicleNumber: t.vehicle?.vehicleNumber || 'N/A',
        driverName: t.driver?.name || 'N/A',
        driverId: t.driverId,
        vehicleId: t.vehicleId,
        customerName: t.party?.name || 'N/A',
        route: `${t.fromLocation?.name || 'N/A'} → ${t.toLocation?.name || 'N/A'}`,
        freightAmount: freight,
        driverAdvance: adv,
        driverAllowance: allowance,
        fuelExpense: fuel,
        tollCharges: toll,
        loadingUnloading: loading,
        maintenanceCost: maintenance,
        rawOtherExpenses: other,
        otherExpenses: other + maintenance, // Include maintenance in "Other Expenses" for Driver detailed view
        totalExpenses,
        profitLoss,
        driverSettlementAmount: settlementAmount,
        remainingDriverBalance: remainingBalance,
        paymentStatus
      };
    });

    // 2. Fetch Non-trip-linked expenses and fuel for vehicle-wise totals
    const nonTripDiesels = await Diesel.findAll({
      where: {
        tripId: null,
        ...dateRangeFilter(startDate, endDate, 'date')
      }
    });

    const nonTripExpenses = await Expense.findAll({
      where: {
        tripId: null,
        ...dateRangeFilter(startDate, endDate, 'date')
      },
      include: [{ model: ExpenseHead, as: 'expenseHead', attributes: ['name'] }]
    });

    // Group non-trip items by vehicleId
    const vehicleNonTripDiesel = {};
    nonTripDiesels.forEach(d => {
      if (d.vehicleId) {
        if (!vehicleNonTripDiesel[d.vehicleId]) vehicleNonTripDiesel[d.vehicleId] = 0;
        vehicleNonTripDiesel[d.vehicleId] += parseFloat(d.totalAmount || 0);
      }
    });

    const vehicleNonTripExpenses = {};
    nonTripExpenses.forEach(e => {
      if (e.vehicleId) {
        if (!vehicleNonTripExpenses[e.vehicleId]) {
          vehicleNonTripExpenses[e.vehicleId] = { maintenance: 0, tollOther: 0, diesel: 0 };
        }
        const headName = e.expenseHead?.name || '';
        const amt = parseFloat(e.amount || 0);

        if (isMaintenance(headName)) {
          vehicleNonTripExpenses[e.vehicleId].maintenance += amt;
        } else if (isDiesel(headName)) {
          vehicleNonTripExpenses[e.vehicleId].diesel += amt;
        } else {
          vehicleNonTripExpenses[e.vehicleId].tollOther += amt;
        }
      }
    });

    // 3. Process Vehicle-wise Aggregations
    const vehiclesData = {};

    tripRows.forEach(row => {
      const vId = row.vehicleId;
      if (!vId) return;

      if (!vehiclesData[vId]) {
        vehiclesData[vId] = {
          vehicleNumber: row.vehicleNumber,
          totalTrips: 0,
          totalRevenue: 0,
          fuelCost: 0,
          maintenanceCost: 0,
          driverCost: 0,
          tollOtherCost: 0,
          totalExpenses: 0,
          netProfitLoss: 0
        };
      }

      const v = vehiclesData[vId];
      v.totalTrips += 1;
      v.totalRevenue += row.freightAmount;
      v.fuelCost += row.fuelExpense;
      v.driverCost += row.driverAllowance + row.driverAdvance;
      v.maintenanceCost += row.maintenanceCost;
      v.tollOtherCost += row.tollCharges + row.rawOtherExpenses + row.loadingUnloading;
    });

    // Merge general vehicle non-trip diesel and expenses
    const allVehicles = await Vehicle.findAll({ attributes: ['id', 'vehicleNumber'] });
    allVehicles.forEach(veh => {
      const vId = veh.id;
      const generalDiesel = (vehicleNonTripDiesel[vId] || 0) + (vehicleNonTripExpenses[vId]?.diesel || 0);
      const generalMaint = vehicleNonTripExpenses[vId]?.maintenance || 0;
      const generalTollOther = vehicleNonTripExpenses[vId]?.tollOther || 0;

      if (generalDiesel > 0 || generalMaint > 0 || generalTollOther > 0) {
        if (!vehiclesData[vId]) {
          vehiclesData[vId] = {
            vehicleNumber: veh.vehicleNumber,
            totalTrips: 0,
            totalRevenue: 0,
            fuelCost: 0,
            maintenanceCost: 0,
            driverCost: 0,
            tollOtherCost: 0,
            totalExpenses: 0,
            netProfitLoss: 0
          };
        }
        const v = vehiclesData[vId];
        v.fuelCost += generalDiesel;
        v.maintenanceCost += generalMaint;
        v.tollOtherCost += generalTollOther;
      }
    });

    // Finalize vehicle summary calculations
    const vehicleRows = Object.values(vehiclesData).map(v => {
      v.totalExpenses = v.fuelCost + v.maintenanceCost + v.driverCost + v.tollOtherCost;
      v.netProfitLoss = v.totalRevenue - v.totalExpenses;
      return {
        vehicleNumber: v.vehicleNumber,
        totalTrips: v.totalTrips,
        totalRevenue: parseFloat(v.totalRevenue.toFixed(2)),
        fuelCost: parseFloat(v.fuelCost.toFixed(2)),
        maintenanceCost: parseFloat(v.maintenanceCost.toFixed(2)),
        driverCost: parseFloat(v.driverCost.toFixed(2)),
        tollOtherCost: parseFloat(v.tollOtherCost.toFixed(2)),
        totalExpenses: parseFloat(v.totalExpenses.toFixed(2)),
        netProfitLoss: parseFloat(v.netProfitLoss.toFixed(2))
      };
    });

    // 4. Process Driver-wise Aggregations
    const driversData = {};
    tripRows.forEach(row => {
      const dName = row.driverName;
      if (!driversData[dName]) {
        driversData[dName] = {
          driverName: dName,
          totalTrips: 0,
          totalRevenue: 0,
          totalExpenses: 0,
          netProfitLoss: 0
        };
      }
      const d = driversData[dName];
      d.totalTrips += 1;
      d.totalRevenue += row.freightAmount;
      d.totalExpenses += row.totalExpenses;
      d.netProfitLoss += row.profitLoss;
    });

    const driverRows = Object.values(driversData).map(d => ({
      driverName: d.driverName,
      totalTrips: d.totalTrips,
      totalRevenue: parseFloat(d.totalRevenue.toFixed(2)),
      totalExpenses: parseFloat(d.totalExpenses.toFixed(2)),
      netProfitLoss: parseFloat(d.netProfitLoss.toFixed(2))
    }));

    // 5. Overall Summary
    const totalRevenue = tripRows.reduce((acc, curr) => acc + curr.freightAmount, 0);
    // Include trip-level costs + non-trip vehicle costs
    const totalExpenses = vehicleRows.reduce((acc, curr) => acc + curr.totalExpenses, 0);
    const netProfitLoss = totalRevenue - totalExpenses;

    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          totalRevenue: parseFloat(totalRevenue.toFixed(2)),
          totalExpenses: parseFloat(totalExpenses.toFixed(2)),
          netProfitLoss: parseFloat(netProfitLoss.toFixed(2))
        },
        trips: tripRows,
        vehicles: vehicleRows,
        drivers: driverRows
      }
    });
  } catch (error) {
    next(error);
  }
};
