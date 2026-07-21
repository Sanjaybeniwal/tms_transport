const AppError = require('../utils/appError');

const validateBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, allowUnknown: true });
    if (error) {
      const errorDetails = error.details.map(detail => detail.message).join('. ');
      return next(new AppError(`Validation failed: ${errorDetails}`, 400));
    }
    req.body = value;
    next();
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, { abortEarly: false, allowUnknown: true });
    if (error) {
      const errorDetails = error.details.map(detail => detail.message).join('. ');
      return next(new AppError(`Validation failed: ${errorDetails}`, 400));
    }
    req.query = value;
    next();
  };
};

module.exports = {
  validateBody,
  validateQuery
};
