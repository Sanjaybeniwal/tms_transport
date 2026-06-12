const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const { User } = require('../models');
const logger = require('../utils/logger');
require('dotenv').config();

module.exports = async (req, res, next) => {
  try {
    // 1. Get token from Authorization header
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_tms_token_signing_key_2026_production_grade');

    // 3. Check if user still exists
    const currentUser = await User.findByPk(decoded.id);
    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    if (currentUser.status === 'Inactive') {
      return next(new AppError('This user account has been deactivated.', 403));
    }

    // Grant access to protected route
    req.user = currentUser;
    next();
  } catch (error) {
    logger.error('Authentication Error:', error);
    return next(new AppError('Not authorized to access this route.', 401));
  }
};
