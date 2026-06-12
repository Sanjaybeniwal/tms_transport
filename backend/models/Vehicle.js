const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Vehicle = sequelize.define('Vehicle', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  vehicleNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  vehicleType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  ownerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Owners',
      key: 'id'
    }
  },
  rcNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  insuranceNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  insuranceExpiry: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  fitnessExpiry: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  permitExpiry: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  nationalPermitNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  nationalPermitExpiry: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  pollutionExpiry: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive'),
    defaultValue: 'Active'
  }
});

module.exports = Vehicle;
