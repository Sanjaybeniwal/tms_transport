const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { validateBody } = require('../middleware/validationMiddleware');
const { authSchemas } = require('../utils/validationSchemas');

router.post('/login', validateBody(authSchemas.login), authController.login);
router.post('/forgot-password', validateBody(authSchemas.forgotPassword), authController.forgotPassword);
router.post('/reset-password', validateBody(authSchemas.resetPassword), authController.resetPassword);

// Protected routes
router.use(authMiddleware);

router.get('/me', authController.getCurrentUser);
router.post('/change-password', validateBody(authSchemas.changePassword), authController.changePassword);

// Register user (Only Super Admin and Admin can create new users)
router.post('/register', roleMiddleware('Super Admin', 'Admin'), validateBody(authSchemas.createUser), authController.createUser);

module.exports = router;
