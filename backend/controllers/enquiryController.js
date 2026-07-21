const { Enquiry } = require('../models');
const AppError = require('../utils/appError');
const { Op } = require('sequelize');

// Create a new enquiry (Public)
exports.createEnquiry = async (req, res, next) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !message) {
      return next(new AppError('Name and Message are required fields.', 400));
    }

    const newEnquiry = await Enquiry.create({
      name,
      email,
      message,
      status: 'New'
    });

    res.status(201).json({
      status: 'success',
      data: newEnquiry
    });
  } catch (error) {
    next(error);
  }
};

// Get all enquiries (Admin only)
exports.getAllEnquiries = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const whereClause = {};

    if (status && status !== 'All') {
      whereClause.status = status;
    }

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { message: { [Op.like]: `%${search}%` } }
      ];
    }

    const enquiries = await Enquiry.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      status: 'success',
      data: enquiries
    });
  } catch (error) {
    next(error);
  }
};

// Update enquiry status / notes (Admin only)
exports.updateEnquiryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const enquiry = await Enquiry.findByPk(id);
    if (!enquiry) {
      return next(new AppError('Enquiry not found', 404));
    }

    if (status) {
      if (!['New', 'In Progress', 'Resolved'].includes(status)) {
        return next(new AppError('Invalid status value', 400));
      }
      enquiry.status = status;
    }

    if (notes !== undefined) {
      enquiry.notes = notes;
    }

    await enquiry.save();

    res.status(200).json({
      status: 'success',
      data: enquiry
    });
  } catch (error) {
    next(error);
  }
};

// Delete enquiry (Admin only)
exports.deleteEnquiry = async (req, res, next) => {
  try {
    const { id } = req.params;

    const enquiry = await Enquiry.findByPk(id);
    if (!enquiry) {
      return next(new AppError('Enquiry not found', 404));
    }

    await enquiry.destroy();

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};
