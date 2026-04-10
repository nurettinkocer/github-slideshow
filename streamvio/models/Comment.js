/**
 * Comment Model
 */
const { pool } = require('../config/database');

class Comment {
  static async getByContent(contentId, status = 'approved') {
    const [rows] = await pool.query(
      `SELECT c.*, u.name as user_name, u.avatar as user_avatar
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.content_id = ? AND c.status = ?
       ORDER BY c.created_at DESC`,
      [contentId, status]
    );
    return rows;
  }

  static async getAll(options = {}) {
    const { status = null, contentId = null, search = null, limit = 20, offset = 0 } = options;
    let query = `
      SELECT cm.*, ct.title as content_title, ct.slug as content_slug,
             u.name as user_name
      FROM comments cm
      LEFT JOIN contents ct ON cm.content_id = ct.id
      LEFT JOIN users u ON cm.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) { query += ' AND cm.status = ?'; params.push(status); }
    if (contentId) { query += ' AND cm.content_id = ?'; params.push(contentId); }
    if (search) {
      query += ' AND (cm.comment_text LIKE ? OR cm.author_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY cm.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async create(data) {
    const [result] = await pool.query(
      `INSERT INTO comments (content_id, user_id, author_name, comment_text, status, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.content_id,
        data.user_id || null,
        data.author_name || 'Anonim Kullanıcı',
        data.comment_text,
        data.status || 'approved',
        data.ip_address || null
      ]
    );
    return result.insertId;
  }

  static async updateStatus(id, status) {
    const [result] = await pool.query(
      'UPDATE comments SET status = ? WHERE id = ?',
      [status, id]
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await pool.query('DELETE FROM comments WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async deleteMultiple(ids) {
    const [result] = await pool.query('DELETE FROM comments WHERE id IN (?)', [ids]);
    return result.affectedRows;
  }

  static async count(status = null) {
    let query = 'SELECT COUNT(*) as total FROM comments';
    const params = [];
    if (status) { query += ' WHERE status = ?'; params.push(status); }
    const [rows] = await pool.query(query, params);
    return rows[0].total;
  }
}

module.exports = Comment;
