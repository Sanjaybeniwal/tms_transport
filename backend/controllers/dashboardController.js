const { Vehicle, Owner, Driver, Trip, Pump, Diesel, IncomeLog, Expense, PumpPayment } = require('../models');
const { Op } = require('sequelize');

exports.getDashboardStats = async (req, res, next) => {
  try {
    // 1. Core counters
    const totalVehicles = await Vehicle.count();
    const totalOwners = await Owner.count();
    const totalDrivers = await Driver.count();
    const totalTrips = await Trip.count();
    const totalPumps = await Pump.count();

    // 2. Financial totals
    const totalDieselExpense = await Diesel.sum('totalAmount') || 0;
    const totalOtherExpense = await Expense.sum('amount') || 0;
    const totalIncome = await IncomeLog.sum('amount') || 0;
    const totalExpenses = parseFloat(totalDieselExpense) + parseFloat(totalOtherExpense);

    // Outstanding pump balances
    const pumpOpeningSum = await Pump.sum('openingBalance') || 0;
    const pumpDieselSum = await Diesel.sum('totalAmount') || 0;
    const pumpPaymentsSum = await PumpPayment.sum('amount') || 0;
    const outstandingPumpAmount = parseFloat(pumpOpeningSum) + parseFloat(pumpDieselSum) - parseFloat(pumpPaymentsSum);

    // 3. Prepare Chart Data (Past 6 Months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyStats = {};

    // Initialize past 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyStats[key] = {
        month: `${monthNames[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`,
        income: 0,
        expense: 0,
        dieselQty: 0
      };
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const startLimitStr = sixMonthsAgo.toISOString().split('T')[0];

    // Query past 6 months income
    const incomes = await IncomeLog.findAll({
      where: { date: { [Op.gte]: startLimitStr } }
    });
    incomes.forEach(inc => {
      const key = inc.date.substring(0, 7); // 'YYYY-MM'
      if (monthlyStats[key]) {
        monthlyStats[key].income += parseFloat(inc.amount);
      }
    });

    // Query past 6 months other expenses
    const expenses = await Expense.findAll({
      where: { date: { [Op.gte]: startLimitStr } }
    });
    expenses.forEach(exp => {
      const key = exp.date.substring(0, 7);
      if (monthlyStats[key]) {
        monthlyStats[key].expense += parseFloat(exp.amount);
      }
    });

    // Query past 6 months diesel refueling
    const diesels = await Diesel.findAll({
      where: { date: { [Op.gte]: startLimitStr } }
    });
    diesels.forEach(dsl => {
      const key = dsl.date.substring(0, 7);
      if (monthlyStats[key]) {
        monthlyStats[key].expense += parseFloat(dsl.totalAmount);
        monthlyStats[key].dieselQty += parseFloat(dsl.quantity);
      }
    });

    const chartsData = Object.values(monthlyStats);

    // 4. Vehicle performance (Top Vehicles by Net Profit)
    // Find all active vehicles
    const activeVehicles = await Vehicle.findAll({
      limit: 5,
      attributes: ['id', 'vehicleNumber']
    });

    const performance = [];
    for (let v of activeVehicles) {
      const vIncome = await IncomeLog.sum('amount', {
        include: [{ model: Trip, as: 'trip', where: { vehicleId: v.id } }]
      }) || 0;

      const vDiesel = await Diesel.sum('totalAmount', { where: { vehicleId: v.id } }) || 0;
      const vOther = await Expense.sum('amount', { where: { vehicleId: v.id } }) || 0;

      const vExpense = parseFloat(vDiesel) + parseFloat(vOther);
      const vProfit = parseFloat(vIncome) - vExpense;

      performance.push({
        vehicleNumber: v.vehicleNumber,
        income: parseFloat(vIncome),
        expense: vExpense,
        profit: vProfit
      });
    }

    // Sort performance by profit
    performance.sort((a, b) => b.profit - a.profit);

    // Compute real-time pump limits and consumption
    const pumps = await Pump.findAll({ where: { status: 'Active' } });
    const pumpStats = [];
    for (let p of pumps) {
      const consumed = await Diesel.sum('totalAmount', { where: { pumpId: p.id } }) || 0;
      const limit = parseFloat(p.allocatedLimit || 0);
      const remaining = limit - parseFloat(consumed);
      pumpStats.push({
        id: p.id,
        name: p.name,
        limit: limit.toFixed(2),
        consumed: parseFloat(consumed).toFixed(2),
        remaining: remaining.toFixed(2)
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        cards: {
          totalVehicles,
          totalOwners,
          totalDrivers,
          totalTrips,
          totalPumps,
          totalDieselExpense: parseFloat(totalDieselExpense).toFixed(2),
          totalIncome: parseFloat(totalIncome).toFixed(2),
          totalExpenses: totalExpenses.toFixed(2),
          outstandingAmount: outstandingPumpAmount.toFixed(2)
        },
        monthlyTrends: chartsData,
        performance,
        pumpStats
      }
    });
  } catch (error) {
    next(error);
  }
};
