const { Op } = require('sequelize');
const AppError = require('../utils/appError');

exports.getAll = (Model, includeModels = [], searchFields = []) => async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'DESC';

    // Build dynamic conditions
    const where = {};

    // text search
    if (search && searchFields.length > 0) {
      where[Op.or] = searchFields.map(field => ({
        [field]: { [Op.like]: `%${search}%` }
      }));
    }

    // dynamic query parameters filtering
    const excludeFields = ['page', 'limit', 'search', 'sortBy', 'sortOrder'];
    Object.keys(req.query).forEach(key => {
      if (!excludeFields.includes(key) && req.query[key] !== undefined && req.query[key] !== '') {
        where[key] = req.query[key];
      }
    });

    const { count, rows } = await Model.findAndCountAll({
      where,
      include: includeModels,
      limit,
      offset,
      order: [[sortBy, sortOrder]]
    });

    res.status(200).json({
      status: 'success',
      total: count,
      page,
      pages: Math.ceil(count / limit),
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

exports.getOne = (Model, includeModels = []) => async (req, res, next) => {
  try {
    const doc = await Model.findByPk(req.params.id, {
      include: includeModels
    });

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: doc
    });
  } catch (error) {
    next(error);
  }
};

exports.createOne = (Model) => async (req, res, next) => {
  try {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: doc
    });
  } catch (error) {
    next(error);
  }
};

exports.updateOne = (Model) => async (req, res, next) => {
  try {
    const doc = await Model.findByPk(req.params.id);

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    await doc.update(req.body);

    res.status(200).json({
      status: 'success',
      data: doc
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteOne = (Model) => async (req, res, next) => {
  try {
    const doc = await Model.findByPk(req.params.id);

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    await doc.destroy();

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};
