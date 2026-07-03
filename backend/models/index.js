const User = require('./User');
const Owner = require('./Owner');
const Vehicle = require('./Vehicle');
const Driver = require('./Driver');
const Location = require('./Location');
const Party = require('./Party');
const Trip = require('./Trip');
const ExpenseHead = require('./ExpenseHead');
const Expense = require('./Expense');
const Pump = require('./Pump');
const Diesel = require('./Diesel');
const PumpPayment = require('./PumpPayment');
const DriverAdvance = require('./DriverAdvance');
const IncomeLog = require('./IncomeLog');
const Page = require('./Page');
const Enquiry = require('./Enquiry');

// Define Relationships

// Owner <-> Vehicle
Owner.hasMany(Vehicle, { foreignKey: 'ownerId', as: 'vehicles' });
Vehicle.belongsTo(Owner, { foreignKey: 'ownerId', as: 'owner' });

// Vehicle <-> Trip
Vehicle.hasMany(Trip, { foreignKey: 'vehicleId', as: 'trips' });
Trip.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });

// Driver <-> Trip
Driver.hasMany(Trip, { foreignKey: 'driverId', as: 'trips' });
Trip.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' });

// Location <-> Trip (Source / Destination)
Location.hasMany(Trip, { foreignKey: 'fromLocationId', as: 'outgoingTrips' });
Trip.belongsTo(Location, { foreignKey: 'fromLocationId', as: 'fromLocation' });

Location.hasMany(Trip, { foreignKey: 'toLocationId', as: 'incomingTrips' });
Trip.belongsTo(Location, { foreignKey: 'toLocationId', as: 'toLocation' });

// Party <-> Trip
Party.hasMany(Trip, { foreignKey: 'partyId', as: 'trips' });
Trip.belongsTo(Party, { foreignKey: 'partyId', as: 'party' });

// ExpenseHead <-> Expense
ExpenseHead.hasMany(Expense, { foreignKey: 'expenseHeadId', as: 'expenses' });
Expense.belongsTo(ExpenseHead, { foreignKey: 'expenseHeadId', as: 'expenseHead' });

// Vehicle <-> Expense
Vehicle.hasMany(Expense, { foreignKey: 'vehicleId', as: 'expenses' });
Expense.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });

// Trip <-> Expense
Trip.hasMany(Expense, { foreignKey: 'tripId', as: 'expenses' });
Expense.belongsTo(Trip, { foreignKey: 'tripId', as: 'trip' });

// Pump <-> Diesel
Pump.hasMany(Diesel, { foreignKey: 'pumpId', as: 'diesels' });
Diesel.belongsTo(Pump, { foreignKey: 'pumpId', as: 'pump' });

// Vehicle <-> Diesel
Vehicle.hasMany(Diesel, { foreignKey: 'vehicleId', as: 'diesels' });
Diesel.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });

// Driver <-> Diesel
Driver.hasMany(Diesel, { foreignKey: 'driverId', as: 'diesels' });
Diesel.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' });

// Trip <-> Diesel
Trip.hasMany(Diesel, { foreignKey: 'tripId', as: 'diesels' });
Diesel.belongsTo(Trip, { foreignKey: 'tripId', as: 'trip' });

// Pump <-> PumpPayment
Pump.hasMany(PumpPayment, { foreignKey: 'pumpId', as: 'payments' });
PumpPayment.belongsTo(Pump, { foreignKey: 'pumpId', as: 'pump' });

// Driver <-> DriverAdvance
Driver.hasMany(DriverAdvance, { foreignKey: 'driverId', as: 'advances' });
DriverAdvance.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' });

// Trip <-> DriverAdvance
Trip.hasMany(DriverAdvance, { foreignKey: 'tripId', as: 'advances' });
DriverAdvance.belongsTo(Trip, { foreignKey: 'tripId', as: 'trip' });

// Party <-> IncomeLog
Party.hasMany(IncomeLog, { foreignKey: 'partyId', as: 'incomes' });
IncomeLog.belongsTo(Party, { foreignKey: 'partyId', as: 'party' });

// Trip <-> IncomeLog
Trip.hasMany(IncomeLog, { foreignKey: 'tripId', as: 'incomes' });
IncomeLog.belongsTo(Trip, { foreignKey: 'tripId', as: 'trip' });

module.exports = {
  User,
  Owner,
  Vehicle,
  Driver,
  Location,
  Party,
  Trip,
  ExpenseHead,
  Expense,
  Pump,
  Diesel,
  PumpPayment,
  DriverAdvance,
  IncomeLog,
  Page,
  Enquiry
};
