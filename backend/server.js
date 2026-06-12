const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB, sequelize } = require('./config/database');
const seedDatabase = require('./config/seed');
const logger = require('./utils/logger');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Import Routes
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/v1', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Transport Management System API is healthy.',
    timestamp: new Date()
  });
});

// Capture undefined routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler Middleware
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;

// Start Server
const startServer = async () => {
  // Connect to DB
  await connectDB();

  // Sync database models (creates tables if not exist)
  try {
    logger.info('Syncing database models...');
    await sequelize.sync({ alter: true }); // Automatically updates schema tables safely
    logger.info('Database models synced successfully.');

    // Seed default records
    await seedDatabase();
  } catch (error) {
    logger.error('Error syncing database schemas:', error);
  }

  app.listen(PORT, () => {
    logger.info(`TMS Backend server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer();
