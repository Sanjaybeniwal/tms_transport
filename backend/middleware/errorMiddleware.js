const logger = require('../utils/logger');

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else {
    // Programming or other unknown error: don't leak details
    logger.error('ERROR 💥:', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong on the server!'
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    // Handle Sequelize validation errors or JWT errors
    let error = err;

    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
      const messages = err.errors.map(el => el.message);
      error = new (require('../utils/appError'))(`Invalid input data: ${messages.join('. ')}`, 400);
    }
    if (err.name === 'JsonWebTokenError') {
      error = new (require('../utils/appError'))('Invalid token. Please log in again!', 401);
    }
    if (err.name === 'TokenExpiredError') {
      error = new (require('../utils/appError'))('Your token has expired! Please log in again.', 401);
    }

    sendErrorProd(error, res);
  }
};
