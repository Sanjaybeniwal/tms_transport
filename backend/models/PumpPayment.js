const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PumpPayment = sequelize.define('PumpPayment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  pumpId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Pumps',
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
  transactionNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  paymentMethod: {
    type: DataTypes.ENUM('Cash', 'UPI', 'PhonePe', 'Paytm', 'Net Banking', 'CRED', 'Cheque'),
    allowNull: false
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

module.exports = PumpPayment;
