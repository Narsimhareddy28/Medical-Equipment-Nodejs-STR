// controllers/managerController.js
const db = require('../db');

const managerController = {
  // ... Other methods ...
  renderRegister: (req, res) => {
    res.render('managerregister');
  },
  // Handle manager registration
  registerManager: (req, res) => {
    const { username, password, fullName } = req.body;

    // TODO: Implement the logic to insert the manager into the database
    // For demonstration purposes, let's assume a simple synchronous insert
    // You should use async functions, hashing, and proper error handling in a real application

    const insertQuery = `
      INSERT INTO managers (username, password, full_Name)
      VALUES (?, ?, ?)
    `;

    const values = [username, password, fullName];

    db.query(insertQuery, values, (error, results) => {
      if (error) {
        console.error('Error registering manager:', error.message);
        // Handle the error and provide feedback to the user
        res.status(500).send('Error registering manager. Please try again.');
      } else {
        // Registration successful, you might redirect to a login page or dashboard
        res.redirect('/managers/login');
      }
    });
  },

  // ... Other methods ...

  renderLogin: (req, res) => {
    res.render('managerlogin');
  },
  loginManager: (req, res) => {
    const { username, password } = req.body;

    // TODO: Implement the logic to check manager's credentials
    // You should compare the provided username and password with the stored data in your database
    // Use hashing and proper authentication mechanisms in a real application

    // For demonstration purposes, let's assume a simple synchronous check
    const selectQuery = `
      SELECT id, username, full_Name
      FROM managers
      WHERE username = ? AND password = ?
    `;

    const values = [username, password];

    db.query(selectQuery, values, (error, results) => {
      if (error) {
        console.error('Error querying manager:', error.message);
        res.status(500).send('Internal server error. Please try again.');
      } else {
        if (results.length > 0) {
          // Manager found, set session and redirect to the dashboard
          const manager = results[0];
          req.session.manager = {
            id: manager.id,
            username: manager.username,
            fullName: manager.fullName,
          };
          res.redirect('/managers/dashboard');
        } else {
          // Manager not found, provide feedback to the user
          res.status(401).send('Invalid credentials. Please try again.');
        }
      }
    });
  },


  renderDashboard: (req, res) => {
    // Query all equipment from the materials table
    const selectQuery = `
      SELECT id, name, description, rent_price_per_day, quantity_in_store,supplier_id
      FROM materials;
    `;

    db.query(selectQuery, (error, results) => {
      if (error) {
        console.error('Error querying all equipment:', error.message);
        res.status(500).send('Internal server error. Please try again.');
      } else {
        // Render the manager dashboard with the list of all equipment
        res.render('managerdash', { allEquipment: results });
      }
    });
  },

  logoutManager: (req, res) => {
    req.session.destroy((error) => {
      if (error) {
        console.error('Error destroying session:', error.message);
        res.status(500).send('Internal server error. Please try again.');
      } else {
        res.redirect('/managers/login');
      }
    });
  },

  renderUpdateEquipmentPage: (req, res) => {
    const equipmentId = req.params.id;

    // Query the equipment details based on the equipmentId
    const selectQuery = `
      SELECT id, name, description, rent_price_per_day, quantity_in_store,supplier_id
      FROM materials
      WHERE id = ?;
    `;

    db.query(selectQuery, [equipmentId], (error, results) => {
      if (error) {
        console.error('Error querying equipment details:', error.message);
        res.status(500).send('Internal server error. Please try again.');
      } else if (results.length === 0) {
        res.status(404).send('Equipment not found.');
      } else {
        // Render the update equipment page with the equipment details
        res.render('updateequipment', { equipmentDetails: results[0] });
      }
    });
  },

  updateEquipment: (req, res) => {
    const equipmentId = req.params.id;
    const { name, description, rent_price_per_day, quantity_in_store,supplier_id } = req.body;

    // Update equipment details in the materials table
    const updateQuery = `
      UPDATE materials
      SET name = ?, description = ?, rent_price_per_day = ?, quantity_in_store = ?,supplier_id=?
      WHERE id = ?;
    `;

    const values = [name, description, rent_price_per_day, quantity_in_store, supplier_id,equipmentId];

    db.query(updateQuery, values, (error, results) => {
      if (error) {
        console.error('Error updating equipment:', error.message);
        res.status(500).send('Error updating equipment. Please try again.');
      } else {
        res.redirect('/managers/dashboard');
      }
    });
  },

  addEquipment: (req, res) => {
    // Extract data from the request body
    const { name, manufacturer, description, rent_price_per_day, quantity_in_store, supplier_id } = req.body;

    // Insert the new equipment into the database
    const insertQuery = `
      INSERT INTO materials (name, manufacturer, description, rent_price_per_day, quantity_in_store, supplier_id)
      VALUES (?, ?, ?, ?, ?, ?);
    `;

    db.query(insertQuery, [name, manufacturer, description, rent_price_per_day, quantity_in_store, supplier_id], (error, result) => {
      if (error) {
        console.error('Error adding equipment:', error.message);
        res.status(500).send('Error adding equipment. Please try again.');
      } else {
        console.log('Equipment added successfully:', result);

        // Redirect to the manager's dashboard or equipment list page
        res.redirect('/managers/dashboard');
      }
    });
  },



  renderCreateOrderForm: (req, res) => {
    // Fetch clients and equipment from the database
    const selectClientsQuery = 'SELECT id, name FROM clients';
    const selectEquipmentQuery = 'SELECT id, name, rent_price_per_day FROM materials';

    db.query(selectClientsQuery, (clientError, clientResults) => {
      if (clientError) {
        console.error('Error fetching clients:', clientError.message);
        res.status(500).send('Internal server error. Please try again.');
      } else {
        db.query(selectEquipmentQuery, (equipmentError, equipmentResults) => {
          if (equipmentError) {
            console.error('Error fetching equipment:', equipmentError.message);
            res.status(500).send('Internal server error. Please try again.');
          } else {
            res.render('createorderform', {
              clients: clientResults,
              equipment: equipmentResults,
            });
          }
        });
      }
    });
  },
  createOrder: (req, res) => {
    // Retrieve data from the request body
    const { client, equipment, startDate, endDate, quantity, amountPaid } = req.body;
    console.log('Request Body:', req.body);
    console.log('Equipment ID:', client);

    // Fetch equipment details from the database
    const selectEquipmentQuery = `
      SELECT *
      FROM materials
      WHERE id = ?;
    `;

    db.query(selectEquipmentQuery, [equipment], (equipmentError, equipmentResults) => {
      if (equipmentError) {
        console.error('Error fetching equipment details:', equipmentError.message);
        res.status(500).send('Internal server error. Please try again.');
      } else if (equipmentResults.length === 0) {
        console.log('selectEquipmentQuery:', selectEquipmentQuery);

        res.status(404).send('Equipment not found.');
      } else {
        const equipmentDetails = equipmentResults[0];
        const pricePerDay = equipmentDetails.rent_price_per_day;

        // Calculate the total amount based on equipment price per day and quantity
        const totalAmount = pricePerDay * quantity;

        // Save the order details to the database
        const insertOrderQuery = `
          INSERT INTO transactions (client_id, equipment_id, sdate, edate, tprice, paid_amount,quantity)
          VALUES (?, ?, ?, ?, ?, ?,?);
        `;

        const values = [client, equipment, startDate, endDate, totalAmount, amountPaid,quantity];

        db.query(insertOrderQuery, values, (insertError, insertResults) => {
          if (insertError) {
            console.error('Error creating order:', insertError.message);
            res.status(500).send('Error creating order. Please try again.');
          } else {
            // Order creation successful, you might redirect to a success page
            res.redirect('/managers/dashboard');
          }
        });
      }
    });
  },

  listCustomers: (req, res) => {
    const selectCustomersQuery = `
      SELECT id, name, address
      FROM clients;
    `;

    db.query(selectCustomersQuery, (error, results) => {
      if (error) {
        console.error('Error fetching customers:', error.message);
        res.status(500).send('Internal server error. Please try again.');
      } else {
        res.render('customersList', { customers: results });
      }
    });
  },

  viewOrderHistory :(req, res) => {
    const clientId = req.params.clientId;
  
    // TODO: Fetch order history for the specified client from the database
    const selectOrderHistoryQuery = `
      SELECT *
      FROM transactions
      WHERE client_id = ?;
    `;
  
    db.query(selectOrderHistoryQuery, [clientId], (error, results) => {
      if (error) {
        console.error('Error fetching order history:', error.message);
        res.status(500).send('Internal server error. Please try again.');
      } else {
        const orderHistory = results;
  
        // Render the viewOrderHistory page with the order history data
        res.render('viewOrderHistory', { clientId, orderHistory });
      }
    });
  },

  renderPaymentsList: (req, res) => {
    // Fetch payments from the transactions table
    const selectPaymentsQuery = `
      SELECT
        t.id,
        t.client_id AS clientId,
        c.name AS clientName,
        t.equipment_id AS equipmentId,
        m.name AS equipmentName,
        t.sdate AS startDate,
        t.edate AS endDate,
        t.tprice AS totalAmount,
        t.paid_amount AS amountPaid,
        t.quantity
      FROM transactions t
      INNER JOIN clients c ON t.client_id = c.id
      INNER JOIN materials m ON t.equipment_id = m.id;
    `;

    db.query(selectPaymentsQuery, (error, payments) => {
      if (error) {
        console.error('Error fetching payments:', error.message);
        res.status(500).send('Internal server error. Please try again.');
      } else {
        // Render the payments list page with the fetched payments
        res.render('payments', { payments });
      }
    });
  },

  renderPendingPaymentsList: (req, res) => {
    // Fetch payments from the transactions table with pending amounts
    const selectPaymentsQuery = `
      SELECT
        t.id,
        t.client_id AS clientId,
        c.name AS clientName,
        t.equipment_id AS equipmentId,
        m.name AS equipmentName,
        t.sdate AS startDate,
        t.edate AS endDate,
        t.tprice AS totalAmount,
        t.paid_amount AS amountPaid,
        t.quantity
      FROM transactions t
      INNER JOIN clients c ON t.client_id = c.id
      INNER JOIN materials m ON t.equipment_id = m.id
      WHERE t.tprice > t.paid_amount;
    `;

    db.query(selectPaymentsQuery, (error, pendingPayments) => {
      if (error) {
        console.error('Error fetching pending payments:', error.message);
        res.status(500).send('Internal server error. Please try again.');
      } else {
        // Render the pending payments list page with the fetched pending payments
        res.render('pending', { pendingPayments });
      }
    });
  },

//   getMonthlyProfit : (req, res) => {
//     const selectedMonth = req.params.month; // Assuming the month is passed as a parameter
  
//     // Your database query to get transactions for the selected month
//     const selectQuery = `
//       SELECT tprice, paid_amount
//       FROM transactions
//       WHERE MONTH(sdate) = ?;`;
  
//     db.query(selectQuery, [selectedMonth], (error, results) => {
//       if (error) {
//         console.error('Error fetching monthly profit:', error.message);
//         res.status(500).send('Internal server error. Please try again.');
//       } else {
//         // Calculate the profit based on the retrieved data
//         const totalProfit = calculateTotalProfit(results);
  
//         res.render('manager/monthlyProfitReport', { totalProfit });
//       }
//     });
// //   },
//   calculateTotalProfit : (transactions) => {
//     let totalAmount = 0;
//     let totalPaidAmount = 0;
  
//     transactions.forEach((transaction) => {
//       totalAmount += transaction.total_amount;
//       totalPaidAmount += transaction.paid_amount;
//     });
  
//     // Calculate profit (assuming 65%)
//     const profit = totalAmount * 0.65 - totalPaidAmount;
  
//     return profit.toFixed(2);
//   },

  renderMonthlyReport: (req, res) => {
    res.render('monthlyReport', { monthlyReport: null });
  },
  generateMonthlyReport: (req, res) => {
    const selectedMonth = req.body.selectedMonth;
  
    // Fetch monthly total amount from the database
    const fetchMonthlyTotalQuery = `
      SELECT
        SUM(tprice) AS totalAmount
      FROM transactions
      WHERE MONTH(sdate) = ?;
    `;
  
    db.query(fetchMonthlyTotalQuery, [selectedMonth], (error, results) => {
      if (error) {
        console.error('Error fetching monthly total amount:', error.message);
        res.status(500).send('Internal server error. Please try again.');
      } else {
        const monthlyReport = {
          totalAmount: results[0].totalAmount,
        };
  
        res.render('monthlyReport1', { monthlyReport, selectedMonth });
      }
    });
  },
  



};


module.exports = managerController;
