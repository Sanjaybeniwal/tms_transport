// Protect accounting-managed records even through the original CRUD endpoints.
const M = require('../models');
const { TripAccount } = require('./models');
const AppError = require('../utils/appError');
module.exports = async (req, res, next) => {
  try {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
    const [resource, id] = req.path.split('/').filter(Boolean);
    if (req.method === 'DELETE' && ['expense-heads', 'pumps'].includes(resource)) {
      const records = await (resource === 'expense-heads' ? M.Expense : M.Diesel).findAll({ where: { [resource === 'expense-heads' ? 'expenseHeadId' : 'pumpId']: id } });
      for (const record of records) if (record.idempotencyKey || record.voidedAt || record.tripId && await TripAccount.count({ where: { tripId: record.tripId } })) return next(new AppError('Cannot delete a master used by accounting history', 409));
    }
    const Model = { trips: M.Trip, expenses: M.Expense, diesels: M.Diesel, 'income-logs': M.IncomeLog, 'driver-advances': M.DriverAdvance, vehicles: M.Vehicle }[resource];
    if (!Model) return next();
    const row = id && /^\d+$/.test(id) ? await Model.unscoped().findByPk(id) : null;
    if (resource === 'vehicles' && req.body.classification !== undefined) return next(new AppError('Use accounting vehicle classification', 409));
    let tripId = resource === 'trips' ? row?.id : row?.tripId || req.body.tripId;
    const enrolled = tripId ? await TripAccount.findOne({ where: { tripId } }) : null;
    if (enrolled || row?.voidedAt || row?.createdBy && row?.idempotencyKey) return next(new AppError('This record is managed by Transport Accounting. Use its transaction, revision, or reversal action.', 409));
    if (resource === 'vehicles' && row && ['PUT', 'DELETE'].includes(req.method)) {
      const trips = await M.Trip.findAll({ where: { vehicleId: row.id }, attributes: ['id'] });
      if (trips.length && await TripAccount.count({ where: { tripId: trips.map(t => t.id) } })) {
        if (req.method === 'DELETE' || req.body.ownerId !== undefined && Number(req.body.ownerId) !== row.ownerId) return next(new AppError('Vehicle owner is locked by accounting history', 409));
      }
    }
    next();
  } catch (error) { next(error); }
};
