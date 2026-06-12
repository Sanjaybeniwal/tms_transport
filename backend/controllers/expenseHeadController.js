const { ExpenseHead } = require('../models');
const crud = require('./crudController');

exports.getAllExpenseHeads = crud.getAll(ExpenseHead, [], ['name']);
exports.getExpenseHead = crud.getOne(ExpenseHead);
exports.createExpenseHead = crud.createOne(ExpenseHead);
exports.updateExpenseHead = crud.updateOne(ExpenseHead);
exports.deleteExpenseHead = crud.deleteOne(ExpenseHead);
