const { Trip, Vehicle, Driver, Party, Diesel, Expense, Pump, IncomeLog, Owner, ExpenseHead } = require('../models');
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
        { model: Trip, as: 'trip', attributes: ['tripNumber'] }
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

    // 2. Diesel Expenses
    const dieselTotal = await Diesel.sum('totalAmount', { where: dateFilter }) || 0;

    // 3. Other Expenses grouped by Expense Head
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
