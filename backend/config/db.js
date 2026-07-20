const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT), // <-- Add this
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
console.log("DB Host:", process.env.DB_HOST);
console.log("DB Port:", process.env.DB_PORT);
console.log("DB Name:", process.env.DB_NAME);
console.log("DB User:", process.env.DB_USER);

db.getConnection((err, connection) => {

    if (err) {
        console.error("Database connection failed:");
        console.error(err.message);
        process.exit(1);
    }

    console.log(`Database connected: ${process.env.DB_NAME}`);
    connection.release();

});

module.exports = db;