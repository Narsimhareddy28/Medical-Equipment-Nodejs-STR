const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const clientRoutes = require('./routes/clientRoutes');
const managerRoutes = require('./routes/managerRoutes');

const db = require('./db');
const clientController = require('./controllers/clientController');
const session = require('express-session');


// Use EJS as the view engine
app.set('view engine', 'ejs');

// Set up static files (CSS, images, etc.)
app.use(express.static('public'));

// Body parsing middleware
app.use(express.urlencoded({ extended: true }));

// Define your custom middleware
app.use(
    session({
      secret: 'hi', // Change this to a secure key
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false } // Change to true in a production environment with HTTPS
    })
  );

// Use routes after middleware
app.use('/clients', clientRoutes);
app.use('/managers', managerRoutes);
app.get('/', (req, res) => {
  res.render('home');
});
// Database connection

// Define your routes and controllers here

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
