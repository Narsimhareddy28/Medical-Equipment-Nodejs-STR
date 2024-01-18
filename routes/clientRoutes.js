// clientRoutes.js
const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');

// Define routes and corresponding controllers for clients
router.get('/register', (req, res) => {
    res.render('registration'); // Assumes register.ejs is in the 'views' folder
  });

router.post('/register', clientController.registerClient);
// Render the login page
router.get('/login', clientController.renderLoginPage);

// Handle login form submission
router.post('/login', clientController.loginClient);
// Render the dashboard page
router.get('/dashboard', clientController.renderDashboard);
router.get('/rent/:equipmentId', clientController.renderRentEquipment); // Updated route

router.post('/rent/submit', clientController.submitRent);
router.get('/receipt/:orderId', clientController.generateReceipt);
router.get('/order/edit/:orderId', clientController.renderEditOrder);
router.post('/order/update/:orderId', clientController.updateOrder);
router.get('/order/cancel/:orderId', clientController.cancelOrder);

router.post('/logout', clientController.logoutClient);

module.exports = router;
