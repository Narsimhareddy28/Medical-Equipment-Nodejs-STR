const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'medi'
});
connection.connect((err) => {
    if (err) {
      console.error('Error connecting to the database:', err.message);
      return;
    }
    console.log('Database connected successfully!');
  });
  
module.exports = connection;
