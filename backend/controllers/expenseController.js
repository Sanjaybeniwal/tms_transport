const { Expense, ExpenseHead, Vehicle, Trip } = require('../models');
const crud = require('./crudController');

const includes = [
  { model: ExpenseHead, as: 'expenseHead', attributes: ['id', 'name'] },
  { model: Vehicle, as: 'vehicle', attributes: ['id', 'vehicleNumber'] },
  { model: Trip, as: 'trip', attributes: ['id', 'tripNumber'] }
];

exports.getAllExpenses = crud.getAll(Expense, includes, ['remarks']);
exports.getExpense = crud.getOne(Expense, includes);
exports.createExpense = crud.createOne(Expense);
exports.updateExpense = crud.updateOne(Expense);
exports.deleteExpense = crud.deleteOne(Expense);
