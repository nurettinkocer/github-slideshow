/**
 * Category Model
 * Handles all category-related database operations
 */

const { pool } = require('../config/database');
const slugify = require('slugify');

class Category {
  // Get all active categories
  static async getAll(options = {}) {
    const { activeOnly = false, limit = 100, offset = 0 } = options;
    let query = 'SELECT *, (SELECT COUNT(*) FROM contents WHERE category_id = categories.id AND is_active = 1) as content_count FROM categories';
    const params = [];

    if (activeOnly) {
      query += ' WHERE is_active = 1';
    }
    query += ' ORDER BY sort_order ASC, name ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);
    return rows;
  }

  // Get single category by ID
  static async getById(id) {
    const [rows] = await pool.query(
      'SELECT *, (SELECT COUNT(*) FROM contents WHERE category_id = categories.id AND is_active = 1) as content_count FROM categories WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  // Get single category by slug
  static async getBySlug(slug) {
    const [rows] = await pool.query(
      'SELECT * FROM categories WHERE slug = ? AND is_active = 1',
      [slug]
    );
    return rows[0] || null;
  }

  // Create new category
  static async create(data) {
    const slug = slugify(data.name, { lower: true, strict: true, locale: 'tr' });
    const [result] = await pool.query(
      `INSERT INTO categories (name, slug, description, cover_image, icon, color, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.name,
        data.slug || slug,
        data.description || null,
        data.cover_image || null,
        data.icon || 'bi-collection-play',
        data.color || '#e50914',
        data.sort_order || 0,
        data.is_active !== undefined ? data.is_active : 1
      ]
    );
    return result.insertId;
  }

  // Update category
  static async update(id, data) {
    const fields = [];
    const values = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.slug !== undefined) { fields.push('slug = ?'); values.push(data.slug); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.cover_image !== undefined) { fields.push('cover_image = ?'); values.push(data.cover_image); }
    if (data.icon !== undefined) { fields.push('icon = ?'); values.push(data.icon); }
    if (data.color !== undefined) { fields.push('color = ?'); values.push(data.color); }
    if (data.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(data.sort_order); }
    if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active); }

    if (fields.length === 0) return false;

    values.push(id);
    const [result] = await pool.query(
      `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  // Delete category
  static async delete(id) {
    const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  // Count all categories
  static async count() {
    const [rows] = await pool.query('SELECT COUNT(*) as total FROM categories');
    return rows[0].total;
  }
}

module.exports = Category;
