/**
 * Admin Model
 */
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class Admin {
  static async getByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM admins WHERE email = ? AND is_active = 1', [email]);
    return rows[0] || null;
  }

  static async getById(id) {
    const [rows] = await pool.query(
      'SELECT id, name, email, avatar, role, is_active, last_login FROM admins WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  static async getAll() {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, is_active, last_login, created_at FROM admins ORDER BY created_at DESC'
    );
    return rows;
  }

  static async create(data) {
    const hashedPassword = await bcrypt.hash(data.password, 12);
    const [result] = await pool.query(
      'INSERT INTO admins (name, email, password, role) VALUES (?, ?, ?, ?)',
      [data.name, data.email, hashedPassword, data.role || 'admin']
    );
    return result.insertId;
  }

  static async update(id, data) {
    const fields = [];
    const values = [];

    if (data.name) { fields.push('name = ?'); values.push(data.name); }
    if (data.email) { fields.push('email = ?'); values.push(data.email); }
    if (data.avatar) { fields.push('avatar = ?'); values.push(data.avatar); }
    if (data.password) {
      const hashed = await bcrypt.hash(data.password, 12);
      fields.push('password = ?');
      values.push(hashed);
    }

    if (fields.length === 0) return false;
    values.push(id);

    const [result] = await pool.query(`UPDATE admins SET ${fields.join(', ')} WHERE id = ?`, values);
    return result.affectedRows > 0;
  }

  static async updateLastLogin(id) {
    await pool.query('UPDATE admins SET last_login = NOW() WHERE id = ?', [id]);
  }

  static async verifyPassword(plain, hashed) {
    return bcrypt.compare(plain, hashed);
  }
}

module.exports = Admin;
