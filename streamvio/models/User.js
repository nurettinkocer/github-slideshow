/**
 * User Model
 */
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async getAll(options = {}) {
    const { search = null, role = null, limit = 20, offset = 0 } = options;
    let query = 'SELECT id, name, email, avatar, role, is_active, last_login, created_at FROM users WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (role) { query += ' AND role = ?'; params.push(role); }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async getById(id) {
    const [rows] = await pool.query(
      'SELECT id, name, email, avatar, bio, role, is_active, last_login, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  static async getByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  }

  static async create(data) {
    const hashedPassword = await bcrypt.hash(data.password, 12);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role, is_active) VALUES (?, ?, ?, ?, ?)',
      [data.name, data.email, hashedPassword, data.role || 'user', 1]
    );
    return result.insertId;
  }

  static async update(id, data) {
    const fields = [];
    const values = [];

    if (data.name) { fields.push('name = ?'); values.push(data.name); }
    if (data.email) { fields.push('email = ?'); values.push(data.email); }
    if (data.bio !== undefined) { fields.push('bio = ?'); values.push(data.bio); }
    if (data.avatar) { fields.push('avatar = ?'); values.push(data.avatar); }
    if (data.role) { fields.push('role = ?'); values.push(data.role); }
    if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active); }
    if (data.password) {
      const hashed = await bcrypt.hash(data.password, 12);
      fields.push('password = ?');
      values.push(hashed);
    }

    if (fields.length === 0) return false;
    values.push(id);

    const [result] = await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    return result.affectedRows > 0;
  }

  static async updateLastLogin(id) {
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [id]);
  }

  static async delete(id) {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static async count() {
    const [rows] = await pool.query('SELECT COUNT(*) as total FROM users');
    return rows[0].total;
  }

  static async getFavorites(userId) {
    const [rows] = await pool.query(
      `SELECT c.*, cat.name as category_name, f.created_at as favorited_at
       FROM favorites f
       JOIN contents c ON f.content_id = c.id
       LEFT JOIN categories cat ON c.category_id = cat.id
       WHERE f.user_id = ? AND c.is_active = 1
       ORDER BY f.created_at DESC`,
      [userId]
    );
    return rows.map(r => ({ ...r, display_views: r.real_views * 30 }));
  }

  static async getWatchlist(userId) {
    const [rows] = await pool.query(
      `SELECT c.*, cat.name as category_name, w.watch_progress, w.is_completed, w.updated_at as watch_date
       FROM watchlists w
       JOIN contents c ON w.content_id = c.id
       LEFT JOIN categories cat ON c.category_id = cat.id
       WHERE w.user_id = ? AND c.is_active = 1
       ORDER BY w.updated_at DESC`,
      [userId]
    );
    return rows.map(r => ({ ...r, display_views: r.real_views * 30 }));
  }
}

module.exports = User;
