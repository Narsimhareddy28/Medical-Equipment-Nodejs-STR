// controllers/clientController.js
const db = require('../db');
const ejs = require('ejs');


const clientController = {
  registerClient: (req, res) => {
    // Extract data from the request body
    const { username, password, name, address, telephone } = req.body;


    const insertQuery = `
      INSERT INTO clients (username, password, name, address, number)
      VALUES (?, ?, ?, ?, ?)
    `;

    const values = [username, password, name, address, telephone];

    db.query(insertQuery, values, (error, results) => {
      if (error) {
        console.error('Error registering client:', error.message);
        // Handle the error and provide feedback to the user
        res.status(500).send('Error registering client. Please try again.');
      } else {
        // Registration successful, you might redirect to a login page or dashboard
        res.redirect('/clients/login');
      }
    });
  },
  // Other methods if needed

  renderLoginPage: (req, res) => {
    res.render('clientlogin'); // Assumes login.ejs is in the 'views' folder
  },
  loginClient: (req, res) => {
    const { username, password } = req.body;

    const findClientQuery = 'SELECT * FROM clients WHERE username = ? AND password = ?';
    db.query(findClientQuery, [username, password], (error, results) => {
      if (error) {
        console.error('Error finding client:', error.message);
        res.status(500).send('Internal server error. Please try again.');
      } else {
        if (results.length > 0) {
          // Store user information in the session
          req.session.userId = results[0].id;
          req.session.username = results[0].username;

          // Successful login, redirect to a dashboard or profile page
          res.redirect('/clients/dashboard');
        } else {
          // Failed login, provide feedback to the user
          res.status(401).send('Invalid credentials. Please try again.');
        }
      }
    });
  },


  cancelOrder: (req, res) => {
    const orderId = req.params.orderId;
  
    // Implement deletion logic in the database
    const deleteQuery = `
      DELETE FROM transactions
      WHERE id = ?;
    `;
  
    const values = [orderId];
  
    db.query(deleteQuery, values, (error, results) => {
      if (error) {
        console.error('Error deleting order:', error.message);
        res.status(500).send('Error deleting order. Please try again.');
      } else {
        // Redirect to the client dashboard or order list page
        res.redirect('/clients/dashboard');
      }
    });
  },

  renderDashboard: (req, res) => {
    // Query all available equipment from the materials table
    const selectEquipmentQuery = `
      SELECT id, name, description, rent_price_per_day, quantity_in_store
      FROM materials
      WHERE quantity_in_store > 0;
    `;
  
    // Query order history for the current client
    const clientId = req.session.userId; // Assuming you store the client ID in the session
    const selectOrderHistoryQuery = `
      SELECT
        t.id AS orderId,
        m.name AS equipmentName,
        t.sdate AS startDate,
        t.edate AS endDate,
        t.tprice AS totalAmount,
        t.paid_amount AS amountPaid
      FROM transactions t
      INNER JOIN materials m ON t.equipment_id = m.id
      WHERE t.client_id = ?;
    `;
    const selectUnavailableQuery = `
  SELECT m.name,m.rent_price_per_day, t.edate AS endDate
  FROM transactions t
  RIGHT JOIN materials m ON t.equipment_id = m.id
  WHERE m.quantity_in_store = 0;
`;
db.query(selectUnavailableQuery, (error, unavailableResults) => {
    if (error) {
      console.error('Error querying unavailable equipment:', error.message);
      res.status(500).send('Internal server error. Please try again.');
    } else { 
    // Execute both queries
    db.query(selectEquipmentQuery, (equipmentError, equipmentResults) => {
      if (equipmentError) {
        console.error('Error querying available equipment:', equipmentError.message);
        res.status(500).send('Internal server error. Please try again.');
      } else {
        db.query(selectOrderHistoryQuery, [clientId], (orderHistoryError, orderHistoryResults) => {
          if (orderHistoryError) {
            console.error('Error querying order history:', orderHistoryError.message);
            res.status(500).send('Internal server error. Please try again.');
          } else {
            // Render the client dashboard with the list of available equipment and order history
            res.render('clientdashboard', {
              availableEquipment: equipmentResults,
              orderHistory: orderHistoryResults,
              unavailableEquipment: unavailableResults,

            });
          }
        });
      }
    });
}
});
  },


  renderRentEquipment: (req, res) => {
    const { equipmentId } = req.params;

    // Query equipment details based on equipmentId
    const selectQuery = `
      SELECT id, name, rent_price_per_day, quantity_in_store
      FROM materials
      WHERE id = ?;
    `;

    db.query(selectQuery, [equipmentId], (error, results) => {
      if (error || results.length === 0) {
        console.error('Error querying equipment details:', error.message);
        res.status(404).send('Equipment not found. Please go back to the dashboard.');
      } else {
        // Render the equipment rental page with equipment details
        res.render('rentEquipment', { equipmentDetails: results[0] });
      }
    });
  },



  submitRent: (req, res) => {
    const { equipmentId, quantity, startDate, endDate, amountPaid } = req.body;
    const clientId = req.session.userId;

    // Query equipment details based on equipmentId
    const selectQuery = `
      SELECT id, name, rent_price_per_day, quantity_in_store
      FROM materials
      WHERE id = ?;
    `;

    db.query(selectQuery, [equipmentId], (error, results) => {
      if (error) {
        console.error('Error querying equipment details:', error.message);
        res.status(500).send('Internal server error. Please try again.');
      } else if (results.length === 0) {
        console.error('Equipment not found.');
        res.status(404).send('Equipment not found. Please go back to the dashboard.');
      } else {
        const equipmentDetails = results[0];

        // Calculate total amount
        const rentPricePerDay = parseFloat(equipmentDetails.rent_price_per_day);
        const rentalDays = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
        const totalAmount = rentPricePerDay * rentalDays * quantity;

        // Check if there is sufficient quantity in store
        if (equipmentDetails.quantity_in_store < quantity) {
          res.status(400).send('Not enough quantity available for rent.');
          return;
        }

        // Insert data into transactions table
        const insertQuery = `
          INSERT INTO transactions (client_id, equipment_id, sdate, edate, quantity, tprice, paid_amount)
          VALUES (?, ?, ?, ?, ?, ?, ?);
        `;

        const values = [clientId, equipmentId, startDate, endDate, quantity, totalAmount, amountPaid];

        db.query(insertQuery, values, (insertError, insertResults) => {
          if (insertError) {
            console.error('Error inserting transaction data:', insertError.message);
            res.status(500).send('Error renting equipment. Please try again.');
          } else {
            // Update the quantity in the materials table
            const updateQuery = `
              UPDATE materials
              SET quantity_in_store = quantity_in_store - ?
              WHERE id = ?;
            `;

            db.query(updateQuery, [quantity, equipmentId], (updateError, updateResults) => {
              if (updateError) {
                console.error('Error updating quantity in store:', updateError.message);
                // Handle the error as needed
              }

              // For demonstration purposes, let's assume a simple success response
// After a successful rental
res.redirect(`/clients/receipt/${insertResults.insertId}`);
            });
          }
        });
      }
    });
  },


  generateReceipt: (req, res) => {
    const orderId = req.params.orderId;

    // Fetch order details from the database
    const selectQuery = `
      SELECT
        t.id AS orderId,
        c.id AS clientId,
        c.name AS clientName,
        m.id AS equipmentId,
        m.name AS equipmentName,
        m.description AS equipmentDescription,
        m.manufacturer AS equipmentManufacturer,
        t.sdate AS startDate,
        t.edate AS endDate,
        t.tprice AS totalAmount,
        t.paid_amount AS amountPaid
      FROM transactions t
      INNER JOIN clients c ON t.client_id = c.id
      INNER JOIN materials m ON t.equipment_id = m.id
      WHERE t.id = ?
    `;

    db.query(selectQuery, [orderId], (error, results) => {
      if (error) {
        console.error('Error fetching receipt details:', error.message);
        console.error(error.stack); // Log the stack trace
        res.status(500).send('Error generating receipt. Please try again.');
      } else if (results.length === 0) {
        res.status(404).send('Receipt not found.');
      } else {
        const receiptDetails = {
          orderDetails: {
            id: results[0].orderId,
            equipmentDetails: {
              id: results[0].equipmentId,
              name: results[0].equipmentName,
              description: results[0].equipmentDescription,
              manufacturer: results[0].equipmentManufacturer,
            },
            startDate: results[0].startDate,
            endDate: results[0].endDate,
            totalAmount: results[0].totalAmount,
            amountPaid: results[0].amountPaid,
            pendingAmount: results[0].totalAmount - results[0].amountPaid,
          },
          clientDetails: {
            id: results[0].clientId,
            name: results[0].clientName,
          },
        };

        // Render the receipt using EJS
        ejs.renderFile('views/receipt.ejs', { orderDetails: receiptDetails.orderDetails, clientDetails: receiptDetails.clientDetails }, (renderError, html) => {
            if (renderError) {
            console.error('Error rendering receipt:', renderError.message);
            console.error(renderError.stack); // Log the stack trace
            res.status(500).send('Error generating receipt. Please try again.');
          } else {
            res.send(html);
          }
        });
      }
    });
  },


  renderEditOrder: (req, res) => {
    const orderId = req.params.orderId;

    // Fetch order details from the database
    const selectQuery = `
      SELECT
        t.id AS orderId,
        m.id AS equipmentId,
        m.name AS equipmentName,
        t.quantity,
        t.sdate AS startDate,
        t.edate AS endDate,
        t.tprice AS totalAmount,
        t.paid_amount AS amountPaid
      FROM transactions t
      INNER JOIN materials m ON t.equipment_id = m.id
      WHERE t.id = ?
    `;

    db.query(selectQuery, [orderId], (error, results) => {
      if (error) {
        console.error('Error fetching order details:', error.message);
        res.status(500).send('Error fetching order details. Please try again.');
      } else if (results.length === 0) {
        res.status(404).send('Order not found.');
      } else {
        const orderDetails = {
          id: results[0].orderId,
          equipmentId: results[0].equipmentId,
          equipmentName: results[0].equipmentName,
          quantity: results[0].quantity,
          startDate: results[0].startDate,
          endDate: results[0].endDate,
          totalAmount: results[0].totalAmount,
          amountPaid: results[0].amountPaid,
        };

        // Render the edit order page
        res.render('editorder', { orderDetails });
      }
    });
  },


  updateOrder: (req, res) => {
    const orderId = req.params.orderId;
    const { startDate, endDate, amountPaid } = req.body;

    // Update order details in the database
    const updateQuery = `
      UPDATE transactions
      SET sdate = ?, edate = ?, paid_amount = ?
      WHERE id = ?;
    `;

    const values = [startDate, endDate, amountPaid, orderId];

    db.query(updateQuery, values, (error, results) => {
      if (error) {
        console.error('Error updating order:', error.message);
        res.status(500).send('Error updating order. Please try again.');
      } else {
        // Redirect to the client dashboard or order details page
        res.redirect('/clients/dashboard');
      }
    });
  },
  ////

  
  logoutClient: (req, res) => {
    // Clear the user session
    req.session.destroy((error) => {
      if (error) {
        console.error('Error destroying session:', error.message);
        res.status(500).send('Internal server error. Please try again.');
      } else {
        // Redirect to the login page after logout
        res.redirect('/clients/login');
      }
    });
  },


  // ... Other methods ...
  





  
};

module.exports = clientController;
