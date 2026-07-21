const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Trip = sequelize.define('Trip', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  tripNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  vehicleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Vehicles',
      key: 'id'
    }
  },
  driverId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Drivers',
      key: 'id'
    }
  },
  fromLocationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Locations',
      key: 'id'
    }
  },
  toLocationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Locations',
      key: 'id'
    }
  },
  partyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Parties',
      key: 'id'
    }
  },
  freightAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  advance: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  advanceDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  commission: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  remainingPayment: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  balanceHoldAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  podStatus: {
    type: DataTypes.ENUM('Pending', 'Received', 'Approved'),
    defaultValue: 'Pending'
  },

  balanceReceivedDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Running', 'Completed', 'Cancelled'),
    defaultValue: 'Pending'
  }
});

Trip.beforeSave((trip, options) => {
  const freight = parseFloat(trip.freightAmount || 0);
  const comm = parseFloat(trip.commission || 0);
  const advance = parseFloat(trip.advance || 0);
  const hold = parseFloat(trip.balanceHoldAmount || 0);
  trip.remainingPayment = freight - comm - advance - hold;
});

module.exports = Trip;
