const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Pump = sequelize.define('Pump', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  contactPerson: {
    type: DataTypes.STRING,
    allowNull: true
  },
  mobile: {
    type: DataTypes.STRING,
    allowNull: false
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  openingBalance: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  allocatedLimit: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive'),
    defaultValue: 'Active'
  }
});

module.exports = Pump;
