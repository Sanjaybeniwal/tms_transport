const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM(
      'Super Admin',
      'Admin',
      'Manager',
      'Accountant',
      'Data Entry Operator'
    ),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive'),
    defaultValue: 'Active'
  },
  resetPasswordToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resetPasswordExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastLoginIp: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  hooks: {
    beforeCreate: async (user) => {
      if (user.password && !user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password') && !user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Compare password method
User.prototype.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = User;
