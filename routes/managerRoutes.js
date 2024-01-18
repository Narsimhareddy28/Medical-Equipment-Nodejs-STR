// routes/managerRoutes.js
const express = require('express');
const router = express.Router();
const managerController = require('../controllers/managerController');

// Manager registration and login routes
router.get('/register', managerController.renderRegister);
router.post('/register', managerController.registerManager);
router.get('/login', managerController.renderLogin);
router.post('/login', managerController.loginManager);
router.post('/logout', managerController.logoutManager);
router.get('/dashboard', managerController.renderDashboard);
router.get('/equipment/update/:id', managerController.renderUpdateEquipmentPage);
router.post('/equipment/update/:id', managerController.updateEquipment);
router.post('/equipment/add', managerController.addEquipment);
router.post('/managers/addEquipment', managerController.addEquipment);
router.get('/createOrder', managerController.renderCreateOrderForm);
router.post('/createOrder', managerController.createOrder);
router.get('/customers', managerController.listCustomers);
router.get('/orderHistory/:clientId', managerController.viewOrderHistory);
router.get('/payments', managerController.renderPaymentsList);
router.get('/pendingPayments', managerController.renderPendingPaymentsList);
// router.get('/profit', managerController.renderProfitReport);

// router.get('/monthlyProfit', managerController.getMonthlyProfit);

router.get('/monthlyReportForm', managerController.renderMonthlyReport);

// Monthly report submission route
router.post('/monthlyReport1', managerController.generateMonthlyReport);

module.exports = router;
