const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { validateBody } = require('../middleware/validationMiddleware');
const schemas = require('../utils/validationSchemas');

// Import Controllers
const ownerController = require('../controllers/ownerController');
const vehicleController = require('../controllers/vehicleController');
const driverController = require('../controllers/driverController');
const locationController = require('../controllers/locationController');
const partyController = require('../controllers/partyController');
const tripController = require('../controllers/tripController');
const expenseHeadController = require('../controllers/expenseHeadController');
const expenseController = require('../controllers/expenseController');
const pumpController = require('../controllers/pumpController');
const dieselController = require('../controllers/dieselController');
const pumpPaymentController = require('../controllers/pumpPaymentController');
const driverAdvanceController = require('../controllers/driverAdvanceController');
const incomeLogController = require('../controllers/incomeLogController');
const ledgerController = require('../controllers/ledgerController');
const dashboardController = require('../controllers/dashboardController');
const reportController = require('../controllers/reportController');
const settingsController = require('../controllers/settingsController');
const pageController = require('../controllers/pageController');
const enquiryController = require('../controllers/enquiryController');

// Public endpoints (no JWT required)
router.get('/public/pages/:slug', pageController.getPageBySlug);
router.post('/public/enquiries', enquiryController.createEnquiry);

// All endpoints in this file are protected under JWT
router.use(authMiddleware);

// ==========================================
// ROLE BASED ACCESS RULES
// Super Admin, Admin: Full Access
// Manager: CRUD except User management and deleting core records
// Accountant: Read-only on Masters, CRUD on Expenses/Payments/Incomes/Advances, View Ledgers/Reports
// Data Entry Operator: CRUD on Trips/Expenses/Diesels (No deletion, no financial dashboards/ledgers)
// ==========================================

const allRoles = ['Super Admin', 'Admin', 'Manager', 'Accountant', 'Data Entry Operator'];
const managersAndAdmins = ['Super Admin', 'Admin', 'Manager'];
const financialRoles = ['Super Admin', 'Admin', 'Manager', 'Accountant'];
const nonOperators = ['Super Admin', 'Admin', 'Manager', 'Accountant'];

// ------------------------------------------
// DASHBOARD
// ------------------------------------------
router.get('/dashboard/stats', roleMiddleware(...nonOperators), dashboardController.getDashboardStats);

// ------------------------------------------
// OWNER ROUTES
// ------------------------------------------
router.route('/owners')
  .get(roleMiddleware(...nonOperators), ownerController.getAllOwners)
  .post(roleMiddleware(...managersAndAdmins), validateBody(schemas.ownerSchema), ownerController.createOwner);

router.route('/owners/:id')
  .get(roleMiddleware(...nonOperators), ownerController.getOwner)
  .put(roleMiddleware(...managersAndAdmins), validateBody(schemas.ownerSchema), ownerController.updateOwner)
  .delete(roleMiddleware('Super Admin', 'Admin'), ownerController.deleteOwner);

router.get('/owners/:id/detail', roleMiddleware(...nonOperators), ownerController.getOwnerDetails);

// ------------------------------------------
// VEHICLE ROUTES
// ------------------------------------------
router.get('/vehicles/alerts', roleMiddleware(...allRoles), vehicleController.getExpiryAlerts);
router.get('/vehicles/:id/last-driver', roleMiddleware(...allRoles), vehicleController.getLastDriver);

router.route('/vehicles')
  .get(roleMiddleware(...allRoles), vehicleController.getAllVehicles)
  .post(roleMiddleware(...managersAndAdmins), validateBody(schemas.vehicleSchema), vehicleController.createVehicle);

router.route('/vehicles/:id')
  .get(roleMiddleware(...allRoles), vehicleController.getVehicle)
  .put(roleMiddleware(...managersAndAdmins), validateBody(schemas.vehicleSchema), vehicleController.updateVehicle)
  .delete(roleMiddleware('Super Admin', 'Admin'), vehicleController.deleteVehicle);

// ------------------------------------------
// DRIVER ROUTES
// ------------------------------------------
router.get('/drivers/alerts', roleMiddleware(...allRoles), driverController.getLicenseAlerts);

router.route('/drivers')
  .get(roleMiddleware(...allRoles), driverController.getAllDrivers)
  .post(roleMiddleware(...managersAndAdmins), validateBody(schemas.driverSchema), driverController.createDriver);

router.route('/drivers/:id')
  .get(roleMiddleware(...allRoles), driverController.getDriver)
  .put(roleMiddleware(...managersAndAdmins), validateBody(schemas.driverSchema), driverController.updateDriver)
  .delete(roleMiddleware('Super Admin', 'Admin'), driverController.deleteDriver);

router.get('/drivers/:id/history', roleMiddleware(...allRoles), driverController.getDriverHistory);

// ------------------------------------------
// LOCATION ROUTES
// ------------------------------------------
router.route('/locations')
  .get(roleMiddleware(...allRoles), locationController.getAllLocations)
  .post(roleMiddleware(...managersAndAdmins), validateBody(schemas.locationSchema), locationController.createLocation);

router.route('/locations/:id')
  .get(roleMiddleware(...allRoles), locationController.getLocation)
  .put(roleMiddleware(...managersAndAdmins), validateBody(schemas.locationSchema), locationController.updateLocation)
  .delete(roleMiddleware('Super Admin', 'Admin'), locationController.deleteLocation);

// ------------------------------------------
// PARTY (CUSTOMER) ROUTES
// ------------------------------------------
router.route('/parties')
  .get(roleMiddleware(...allRoles), partyController.getAllParties)
  .post(roleMiddleware(...managersAndAdmins), validateBody(schemas.partySchema), partyController.createParty);

router.route('/parties/:id')
  .get(roleMiddleware(...allRoles), partyController.getParty)
  .put(roleMiddleware(...managersAndAdmins), validateBody(schemas.partySchema), partyController.updateParty)
  .delete(roleMiddleware('Super Admin', 'Admin'), partyController.deleteParty);

// ------------------------------------------
// TRIP ROUTES
// ------------------------------------------
router.route('/trips')
  .get(roleMiddleware(...allRoles), tripController.getAllTrips)
  .post(roleMiddleware(...allRoles), validateBody(schemas.tripSchema), tripController.createTrip);

router.route('/trips/:id')
  .get(roleMiddleware(...allRoles), tripController.getTrip)
  .put(roleMiddleware(...allRoles), validateBody(schemas.tripSchema), tripController.updateTrip)
  .delete(roleMiddleware('Super Admin', 'Admin'), tripController.deleteTrip);

// ------------------------------------------
// EXPENSE HEAD ROUTES
// ------------------------------------------
router.route('/expense-heads')
  .get(roleMiddleware(...allRoles), expenseHeadController.getAllExpenseHeads)
  .post(roleMiddleware(...managersAndAdmins), validateBody(schemas.expenseHeadSchema), expenseHeadController.createExpenseHead);

router.route('/expense-heads/:id')
  .get(roleMiddleware(...allRoles), expenseHeadController.getExpenseHead)
  .put(roleMiddleware(...managersAndAdmins), validateBody(schemas.expenseHeadSchema), expenseHeadController.updateExpenseHead)
  .delete(roleMiddleware('Super Admin', 'Admin'), expenseHeadController.deleteExpenseHead);

// ------------------------------------------
// EXPENSE ROUTES
// ------------------------------------------
router.route('/expenses')
  .get(roleMiddleware(...allRoles), expenseController.getAllExpenses)
  .post(roleMiddleware(...allRoles), validateBody(schemas.expenseSchema), expenseController.createExpense);

router.route('/expenses/:id')
  .get(roleMiddleware(...allRoles), expenseController.getExpense)
  .put(roleMiddleware(...allRoles), validateBody(schemas.expenseSchema), expenseController.updateExpense)
  .delete(roleMiddleware('Super Admin', 'Admin', 'Manager', 'Accountant'), expenseController.deleteExpense);

// ------------------------------------------
// PUMP ROUTES
// ------------------------------------------
router.route('/pumps')
  .get(roleMiddleware(...allRoles), pumpController.getAllPumps)
  .post(roleMiddleware(...managersAndAdmins), validateBody(schemas.pumpSchema), pumpController.createPump);

router.route('/pumps/:id')
  .get(roleMiddleware(...allRoles), pumpController.getPump)
  .put(roleMiddleware(...managersAndAdmins), validateBody(schemas.pumpSchema), pumpController.updatePump)
  .delete(roleMiddleware('Super Admin', 'Admin'), pumpController.deletePump);

// ------------------------------------------
// DIESEL LOG ROUTES
// ------------------------------------------
router.route('/diesels')
  .get(roleMiddleware(...allRoles), dieselController.getAllDiesels)
  .post(roleMiddleware(...allRoles), validateBody(schemas.dieselSchema), dieselController.createDiesel);

router.route('/diesels/:id')
  .get(roleMiddleware(...allRoles), dieselController.getDiesel)
  .put(roleMiddleware(...allRoles), validateBody(schemas.dieselSchema), dieselController.updateDiesel)
  .delete(roleMiddleware('Super Admin', 'Admin', 'Manager', 'Accountant'), dieselController.deleteDiesel);

// ------------------------------------------
// PUMP PAYMENT ROUTES
// ------------------------------------------
router.route('/pump-payments')
  .get(roleMiddleware(...financialRoles), pumpPaymentController.getAllPumpPayments)
  .post(roleMiddleware(...financialRoles), validateBody(schemas.pumpPaymentSchema), pumpPaymentController.createPumpPayment);

router.route('/pump-payments/:id')
  .get(roleMiddleware(...financialRoles), pumpPaymentController.getPumpPayment)
  .put(roleMiddleware(...financialRoles), validateBody(schemas.pumpPaymentSchema), pumpPaymentController.updatePumpPayment)
  .delete(roleMiddleware('Super Admin', 'Admin', 'Manager', 'Accountant'), pumpPaymentController.deletePumpPayment);

// ------------------------------------------
// DRIVER ADVANCE ROUTES
// ------------------------------------------
router.route('/driver-advances')
  .get(roleMiddleware(...allRoles), driverAdvanceController.getAllDriverAdvances)
  .post(roleMiddleware(...allRoles), validateBody(schemas.driverAdvanceSchema), driverAdvanceController.createDriverAdvance);

router.route('/driver-advances/:id')
  .get(roleMiddleware(...allRoles), driverAdvanceController.getDriverAdvance)
  .put(roleMiddleware(...allRoles), validateBody(schemas.driverAdvanceSchema), driverAdvanceController.updateDriverAdvance)
  .delete(roleMiddleware('Super Admin', 'Admin', 'Manager', 'Accountant'), driverAdvanceController.deleteDriverAdvance);

// ------------------------------------------
// INCOME LOG ROUTES
// ------------------------------------------
router.route('/income-logs')
  .get(roleMiddleware(...financialRoles), incomeLogController.getAllIncomeLogs)
  .post(roleMiddleware(...financialRoles), validateBody(schemas.incomeLogSchema), incomeLogController.createIncomeLog);

router.route('/income-logs/:id')
  .get(roleMiddleware(...financialRoles), incomeLogController.getIncomeLog)
  .put(roleMiddleware(...financialRoles), validateBody(schemas.incomeLogSchema), incomeLogController.updateIncomeLog)
  .delete(roleMiddleware('Super Admin', 'Admin', 'Manager', 'Accountant'), incomeLogController.deleteIncomeLog);

// ------------------------------------------
// LEDGER ROUTES
// ------------------------------------------
router.get('/ledgers/vehicles/:vehicleId', roleMiddleware(...financialRoles), ledgerController.getVehicleLedger);
router.get('/ledgers/owners/:ownerId', roleMiddleware(...financialRoles), ledgerController.getOwnerLedger);
router.get('/ledgers/drivers/:driverId', roleMiddleware(...financialRoles), ledgerController.getDriverLedger);
router.get('/ledgers/parties/:partyId', roleMiddleware(...financialRoles), ledgerController.getPartyLedger);
router.get('/ledgers/pumps/:pumpId', roleMiddleware(...financialRoles), ledgerController.getPumpLedger);

// ------------------------------------------
// REPORTS MODULE
// ------------------------------------------
router.get('/reports/vehicles', roleMiddleware(...financialRoles), reportController.getVehicleReport);
router.get('/reports/owners', roleMiddleware(...financialRoles), reportController.getOwnerReport);
router.get('/reports/drivers', roleMiddleware(...financialRoles), reportController.getDriverReport);
router.get('/reports/trips', roleMiddleware(...financialRoles), reportController.getTripReport);
router.get('/reports/expenses', roleMiddleware(...financialRoles), reportController.getExpenseReport);
router.get('/reports/diesels', roleMiddleware(...financialRoles), reportController.getDieselReport);
router.get('/reports/pumps', roleMiddleware(...financialRoles), reportController.getPumpReport);
router.get('/reports/income', roleMiddleware(...financialRoles), reportController.getIncomeReport);
router.get('/reports/profit-loss', roleMiddleware(...financialRoles), reportController.getProfitLossReport);
router.get('/reports/export', roleMiddleware(...financialRoles), reportController.exportReport);
router.get('/dashboard/analytics', dashboardController.getDashboardStats);
router.get('/dashboard/alerts', vehicleController.getExpiryAlerts);

// ------------------------------------------
// SETTINGS MODULE
// ------------------------------------------
router.post('/settings/logo', roleMiddleware('Super Admin', 'Admin', 'Manager'), settingsController.uploadLogo);
router.get('/settings/contact', roleMiddleware('Super Admin', 'Admin', 'Manager'), settingsController.getContactInfo);
router.put('/settings/contact', roleMiddleware('Super Admin', 'Admin', 'Manager'), settingsController.updateContactInfo);

// ------------------------------------------
// PAGE CMS MODULE
// ------------------------------------------
router.get('/pages', roleMiddleware('Super Admin', 'Admin', 'Manager'), pageController.getAllPages);
router.post('/pages', roleMiddleware('Super Admin', 'Admin', 'Manager'), pageController.createPage);
router.put('/pages/:id', roleMiddleware('Super Admin', 'Admin', 'Manager'), pageController.updatePage);
router.delete('/pages/:id', roleMiddleware('Super Admin', 'Admin', 'Manager'), pageController.deletePage);

// ------------------------------------------
// ENQUIRY MANAGER MODULE
// ------------------------------------------
router.get('/enquiries', roleMiddleware('Super Admin', 'Admin', 'Manager', 'Accountant'), enquiryController.getAllEnquiries);
router.patch('/enquiries/:id', roleMiddleware('Super Admin', 'Admin', 'Manager'), enquiryController.updateEnquiryStatus);
router.delete('/enquiries/:id', roleMiddleware('Super Admin', 'Admin', 'Manager'), enquiryController.deleteEnquiry);

module.exports = router;
