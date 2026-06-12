const Joi = require('joi');

const authSchemas = {
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),
  createUser: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('Super Admin', 'Admin', 'Manager', 'Accountant', 'Data Entry Operator').required(),
    status: Joi.string().valid('Active', 'Inactive').default('Active')
  }),
  changePassword: Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required()
  }),
  forgotPassword: Joi.object({
    email: Joi.string().email().required()
  }),
  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(6).required()
  })
};

const ownerSchema = Joi.object({
  name: Joi.string().required(),
  mobile: Joi.string().pattern(/^[0-9]{10,12}$/).required().messages({
    'string.pattern.base': 'Mobile number must be between 10 to 12 digits'
  }),
  email: Joi.string().email().allow('', null),
  address: Joi.string().allow('', null),
  status: Joi.string().valid('Active', 'Inactive').default('Active')
});

const vehicleSchema = Joi.object({
  vehicleNumber: Joi.string().required(),
  vehicleType: Joi.string().required(),
  ownerId: Joi.number().integer().positive().required(),
  rcNumber: Joi.string().required(),
  insuranceNumber: Joi.string().allow('', null),
  insuranceExpiry: Joi.date().iso().allow(null),
  fitnessExpiry: Joi.date().iso().allow(null),
  permitExpiry: Joi.date().iso().allow(null),
  pollutionExpiry: Joi.date().iso().allow(null),
  status: Joi.string().valid('Active', 'Inactive').default('Active')
});

const driverSchema = Joi.object({
  name: Joi.string().required(),
  mobile: Joi.string().pattern(/^[0-9]{10,12}$/).required(),
  address: Joi.string().allow('', null),
  licenseNumber: Joi.string().required(),
  licenseExpiry: Joi.date().iso().required(),
  joiningDate: Joi.date().iso().allow(null),
  salary: Joi.number().precision(2).positive().required(),
  status: Joi.string().valid('Active', 'Inactive').default('Active')
});

const locationSchema = Joi.object({
  name: Joi.string().required(),
  state: Joi.string().required(),
  city: Joi.string().required(),
  status: Joi.string().valid('Active', 'Inactive').default('Active')
});

const partySchema = Joi.object({
  name: Joi.string().required(),
  contactPerson: Joi.string().allow('', null),
  mobile: Joi.string().pattern(/^[0-9]{10,12}$/).required(),
  gstNumber: Joi.string().allow('', null),
  address: Joi.string().allow('', null),
  status: Joi.string().valid('Active', 'Inactive').default('Active')
});

const tripSchema = Joi.object({
  tripNumber: Joi.string().required(),
  vehicleId: Joi.number().integer().positive().required(),
  driverId: Joi.number().integer().positive().required(),
  fromLocationId: Joi.number().integer().positive().required(),
  toLocationId: Joi.number().integer().positive().required(),
  partyId: Joi.number().integer().positive().required(),
  freightAmount: Joi.number().precision(2).positive().required(),
  advance: Joi.number().precision(2).min(0).default(0.00),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().allow(null),
  status: Joi.string().valid('Pending', 'Running', 'Completed', 'Cancelled').default('Pending')
});

const expenseHeadSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow('', null),
  status: Joi.string().valid('Active', 'Inactive').default('Active')
});

const expenseSchema = Joi.object({
  expenseHeadId: Joi.number().integer().positive().required(),
  vehicleId: Joi.number().integer().positive().allow(null),
  tripId: Joi.number().integer().positive().allow(null),
  amount: Joi.number().precision(2).positive().required(),
  date: Joi.date().iso().required(),
  remarks: Joi.string().allow('', null)
});

const pumpSchema = Joi.object({
  name: Joi.string().required(),
  contactPerson: Joi.string().allow('', null),
  mobile: Joi.string().pattern(/^[0-9]{10,12}$/).required(),
  address: Joi.string().allow('', null),
  openingBalance: Joi.number().precision(2).default(0.00),
  status: Joi.string().valid('Active', 'Inactive').default('Active')
});

const dieselSchema = Joi.object({
  vehicleId: Joi.number().integer().positive().required(),
  pumpId: Joi.number().integer().positive().required(),
  driverId: Joi.number().integer().positive().required(),
  tripId: Joi.number().integer().positive().allow(null),
  quantity: Joi.number().precision(2).positive().required(),
  rate: Joi.number().precision(2).positive().required(),
  totalAmount: Joi.number().precision(2).positive().required(),
  date: Joi.date().iso().required()
});

const pumpPaymentSchema = Joi.object({
  pumpId: Joi.number().integer().positive().required(),
  amount: Joi.number().precision(2).positive().required(),
  date: Joi.date().iso().required(),
  transactionNumber: Joi.string().allow('', null),
  paymentMethod: Joi.string().valid('Cash', 'UPI', 'PhonePe', 'Paytm', 'Net Banking', 'CRED', 'Cheque').required(),
  remarks: Joi.string().allow('', null)
});

const driverAdvanceSchema = Joi.object({
  driverId: Joi.number().integer().positive().required(),
  tripId: Joi.number().integer().positive().required(),
  amount: Joi.number().precision(2).positive().required(),
  date: Joi.date().iso().required(),
  remarks: Joi.string().allow('', null)
});

const incomeLogSchema = Joi.object({
  partyId: Joi.number().integer().positive().required(),
  tripId: Joi.number().integer().positive().required(),
  amount: Joi.number().precision(2).positive().required(),
  date: Joi.date().iso().required(),
  remarks: Joi.string().allow('', null)
});

module.exports = {
  authSchemas,
  ownerSchema,
  vehicleSchema,
  driverSchema,
  locationSchema,
  partySchema,
  tripSchema,
  expenseHeadSchema,
  expenseSchema,
  pumpSchema,
  dieselSchema,
  pumpPaymentSchema,
  driverAdvanceSchema,
  incomeLogSchema
};
