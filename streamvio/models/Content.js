/**
 * Content Model
 * Handles all content (film/series/video) database operations
 */

const { pool } = require('../config/database');
const slugify = require('slugify');

class Content {
  // Get all contents with filtering and pagination
  static async getAll(options = {}) {
    const {
      activeOnly = true,
      type = null,
      categoryId = null,
      featured = null,
      trending = null,
      isNew = null,
      search = null,
      limit = 20,
      offset = 0,
      orderBy = 'created_at',
      orderDir = 'DESC'
    } = options;

    let query = `
      SELECT c.*, cat.name as category_name, cat.slug as category_slug
      FROM contents c
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE 1=1
    `;
    const params = [];

    if (activeOnly) { query += ' AND c.is_active = 1'; }
    if (type) { query += ' AND c.content_type = ?'; params.push(type); }
    if (categoryId) { query += ' AND c.category_id = ?'; params.push(categoryId); }
    if (featured !== null) { query += ' AND c.is_featured = ?'; params.push(featured); }
    if (trending !== null) { query += ' AND c.is_trending = ?'; params.push(trending); }
    if (isNew !== null) { query += ' AND c.is_new = ?'; params.push(isNew); }
    if (search) {
      query += ' AND (c.title LIKE ? OR c.description LIKE ? OR c.tags LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const validOrders = ['created_at', 'title', 'rating', 'real_views', 'like_count', 'release_year', 'sort_order'];
    const safeOrder = validOrders.includes(orderBy) ? orderBy : 'created_at';
    const safeDir = orderDir === 'ASC' ? 'ASC' : 'DESC';

    query += ` ORDER BY c.${safeOrder} ${safeDir} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);
    // Apply view multiplier
    return rows.map(row => ({
      ...row,
      display_views: row.real_views * 30
    }));
  }

  // Get single content by ID
  static async getById(id) {
    const [rows] = await pool.query(
      `SELECT c.*, cat.name as category_name, cat.slug as category_slug
       FROM contents c
       LEFT JOIN categories cat ON c.category_id = cat.id
       WHERE c.id = ?`,
      [id]
    );
    if (!rows[0]) return null;
    const row = rows[0];
    return { ...row, display_views: row.real_views * 30 };
  }

  // Get single content by slug
  static async getBySlug(slug) {
    const [rows] = await pool.query(
      `SELECT c.*, cat.name as category_name, cat.slug as category_slug
       FROM contents c
       LEFT JOIN categories cat ON c.category_id = cat.id
       WHERE c.slug = ? AND c.is_active = 1`,
      [slug]
    );
    if (!rows[0]) return null;
    const row = rows[0];
    return { ...row, display_views: row.real_views * 30 };
  }

  // Create new content
  static async create(data) {
    const slug = data.slug || slugify(data.title, { lower: true, strict: true, locale: 'tr' });

    const [result] = await pool.query(
      `INSERT INTO contents (title, slug, short_description, description, content_type, category_id,
        poster_image, banner_image, video_url, trailer_url, release_year, age_rating, duration,
        rating, season_count, episode_count, cast_members, director, tags,
        is_featured, is_trending, is_new, is_active, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.title, slug, data.short_description || null, data.description || null,
        data.content_type || 'film', data.category_id || null,
        data.poster_image || null, data.banner_image || null,
        data.video_url || null, data.trailer_url || null,
        data.release_year || null, data.age_rating || 'Genel',
        data.duration || null, data.rating || 0.0,
        data.season_count || 1, data.episode_count || 0,
        data.cast_members || null, data.director || null, data.tags || null,
        data.is_featured ? 1 : 0, data.is_trending ? 1 : 0,
        data.is_new ? 1 : 0, data.is_active !== undefined ? data.is_active : 1,
        data.sort_order || 0
      ]
    );
    return result.insertId;
  }

  // Update content
  static async update(id, data) {
    const fields = [];
    const values = [];

    const mappings = [
      'title', 'slug', 'short_description', 'description', 'content_type', 'category_id',
      'poster_image', 'banner_image', 'video_url', 'trailer_url', 'release_year', 'age_rating',
      'duration', 'rating', 'season_count', 'episode_count', 'cast_members', 'director', 'tags',
      'is_featured', 'is_trending', 'is_new', 'is_active', 'sort_order'
    ];

    mappings.forEach(field => {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    });

    if (fields.length === 0) return false;

    values.push(id);
    const [result] = await pool.query(
      `UPDATE contents SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  // Increment real view count
  static async incrementView(id) {
    await pool.query('UPDATE contents SET real_views = real_views + 1 WHERE id = ?', [id]);
  }

  // Update like count
  static async updateLikeCount(id) {
    await pool.query(
      'UPDATE contents SET like_count = (SELECT COUNT(*) FROM likes WHERE content_id = ?) WHERE id = ?',
      [id, id]
    );
  }

  // Update comment count
  static async updateCommentCount(id) {
    await pool.query(
      "UPDATE contents SET comment_count = (SELECT COUNT(*) FROM comments WHERE content_id = ? AND status = 'approved') WHERE id = ?",
      [id, id]
    );
  }

  // Delete content
  static async delete(id) {
    const [result] = await pool.query('DELETE FROM contents WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  // Count contents with filters
  static async count(options = {}) {
    const { activeOnly = true, type = null, categoryId = null } = options;
    let query = 'SELECT COUNT(*) as total FROM contents WHERE 1=1';
    const params = [];

    if (activeOnly) { query += ' AND is_active = 1'; }
    if (type) { query += ' AND content_type = ?'; params.push(type); }
    if (categoryId) { query += ' AND category_id = ?'; params.push(categoryId); }

    const [rows] = await pool.query(query, params);
    return rows[0].total;
  }

  // Get similar contents
  static async getSimilar(contentId, categoryId, limit = 6) {
    const [rows] = await pool.query(
      `SELECT c.*, cat.name as category_name FROM contents c
       LEFT JOIN categories cat ON c.category_id = cat.id
       WHERE c.category_id = ? AND c.id != ? AND c.is_active = 1
       ORDER BY c.rating DESC LIMIT ?`,
      [categoryId, contentId, limit]
    );
    return rows.map(row => ({ ...row, display_views: row.real_views * 30 }));
  }

  // Get statistics
  static async getStats() {
    const [rows] = await pool.query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN content_type = 'film' THEN 1 ELSE 0 END) as films,
        SUM(CASE WHEN content_type = 'dizi' THEN 1 ELSE 0 END) as series,
        SUM(CASE WHEN content_type = 'kisa_video' THEN 1 ELSE 0 END) as shorts,
        SUM(real_views) as total_real_views,
        SUM(real_views * 30) as total_display_views,
        SUM(like_count) as total_likes,
        SUM(comment_count) as total_comments,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_count,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_count
      FROM contents
    `);
    return rows[0];
  }
}

module.exports = Content;
