const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Expense = sequelize.define('Expense', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  expenseHeadId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ExpenseHeads',
      key: 'id'
    }
  },
  vehicleId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Vehicles',
      key: 'id'
    }
  },
  tripId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Trips',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

module.exports = Expense;
