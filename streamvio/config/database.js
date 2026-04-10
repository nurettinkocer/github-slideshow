/**
 * Database Configuration
 * MySQL connection pool setup
 */

const mysql = require('mysql2');
require('dotenv').config();

// Create connection pool for better performance
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'streamvio',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+00:00',
  acquireTimeout: 60000,
  connectTimeout: 60000
});

// Promise-based pool
const promisePool = pool.promise();

// Test connection
const testConnection = async () => {
  try {
    const [rows] = await promisePool.query('SELECT 1 as connected');
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

module.exports = { pool: promisePool, testConnection };
