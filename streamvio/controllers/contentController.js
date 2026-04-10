/**
 * Content Controller
 */
const Content = require('../models/Content');
const Category = require('../models/Category');
const Comment = require('../models/Comment');
const { pool } = require('../config/database');

// Get all contents (public)
const getContents = async (req, res) => {
  try {
    const {
      type, category, featured, trending, new: isNew,
      search, limit = 20, page = 1, sort = 'created_at', dir = 'DESC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const options = {
      activeOnly: true,
      type: type || null,
      categoryId: category ? parseInt(category) : null,
      featured: featured !== undefined ? parseInt(featured) : null,
      trending: trending !== undefined ? parseInt(trending) : null,
      isNew: isNew !== undefined ? parseInt(isNew) : null,
      search: search || null,
      limit: Math.min(parseInt(limit), 100),
      offset,
      orderBy: sort,
      orderDir: dir
    };

    const contents = await Content.getAll(options);
    const total = await Content.count({
      activeOnly: true,
      type: options.type,
      categoryId: options.categoryId
    });

    return res.json({
      success: true,
      data: contents,
      pagination: {
        total,
        page: parseInt(page),
        limit: options.limit,
        totalPages: Math.ceil(total / options.limit)
      }
    });
  } catch (error) {
    console.error('getContents error:', error);
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Get single content by slug
const getContentBySlug = async (req, res) => {
  try {
    const content = await Content.getBySlug(req.params.slug);
    if (!content) {
      return res.status(404).json({ success: false, message: 'İçerik bulunamadı' });
    }

    // Get comments
    const comments = await Comment.getByContent(content.id, 'approved');
    // Get similar
    const similar = await Content.getSimilar(content.id, content.category_id, 6);

    return res.json({ success: true, data: { ...content, comments, similar } });
  } catch (error) {
    console.error('getContentBySlug error:', error);
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Record view
const recordView = async (req, res) => {
  try {
    const { id } = req.params;
    const sessionId = req.cookies?.sessionId || req.body?.sessionId;
    const ipAddress = req.ip;

    // Check if same session already viewed recently (1 hour)
    if (sessionId) {
      const [existing] = await pool.query(
        'SELECT id FROM views WHERE content_id = ? AND session_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)',
        [id, sessionId]
      );
      if (existing.length > 0) {
        return res.json({ success: true, message: 'Already counted' });
      }
    }

    // Record view
    await pool.query(
      'INSERT INTO views (content_id, user_id, session_id, ip_address) VALUES (?, ?, ?, ?)',
      [id, req.user?.id || null, sessionId, ipAddress]
    );

    // Increment real_views
    await Content.incrementView(id);

    return res.json({ success: true, message: 'View recorded' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Toggle like
const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const sessionId = req.body?.sessionId || req.cookies?.sessionId;
    const ipAddress = req.ip;

    // Check existing like
    const [existing] = await pool.query(
      'SELECT id FROM likes WHERE content_id = ? AND session_id = ?',
      [id, sessionId]
    );

    if (existing.length > 0) {
      // Unlike
      await pool.query('DELETE FROM likes WHERE content_id = ? AND session_id = ?', [id, sessionId]);
      await Content.updateLikeCount(id);
      const content = await Content.getById(id);
      return res.json({ success: true, liked: false, count: content.like_count });
    } else {
      // Like
      await pool.query(
        'INSERT INTO likes (content_id, user_id, session_id, ip_address) VALUES (?, ?, ?, ?)',
        [id, req.user?.id || null, sessionId, ipAddress]
      );
      await Content.updateLikeCount(id);
      const content = await Content.getById(id);
      return res.json({ success: true, liked: true, count: content.like_count });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Add comment
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { author_name, comment_text } = req.body;

    if (!comment_text || comment_text.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Yorum en az 2 karakter olmalıdır' });
    }

    // XSS prevention - strip HTML
    const cleanText = comment_text.replace(/<[^>]*>/g, '').substring(0, 1000);
    const cleanName = (author_name || 'Anonim Kullanıcı').replace(/<[^>]*>/g, '').substring(0, 100);

    const commentId = await Comment.create({
      content_id: id,
      user_id: req.user?.id || null,
      author_name: req.user?.name || cleanName,
      comment_text: cleanText,
      ip_address: req.ip
    });

    await Content.updateCommentCount(id);

    return res.status(201).json({ success: true, message: 'Yorum eklendi', id: commentId });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// ==================== ADMIN CONTROLLERS ====================

const adminGetContents = async (req, res) => {
  try {
    const { type, category, search, status, limit = 20, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const options = {
      activeOnly: false,
      type: type || null,
      categoryId: category ? parseInt(category) : null,
      search: search || null,
      limit: Math.min(parseInt(limit), 100),
      offset
    };

    const contents = await Content.getAll(options);
    const total = await Content.count({ activeOnly: false });

    return res.json({ success: true, data: contents, pagination: { total, page: parseInt(page) } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

const adminGetContent = async (req, res) => {
  try {
    const content = await Content.getById(req.params.id);
    if (!content) return res.status(404).json({ success: false, message: 'İçerik bulunamadı' });
    return res.json({ success: true, data: content });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

const adminCreateContent = async (req, res) => {
  try {
    const data = { ...req.body };

    if (req.files?.poster_image) data.poster_image = req.files.poster_image[0].filename;
    if (req.files?.banner_image) data.banner_image = req.files.banner_image[0].filename;

    const id = await Content.create(data);
    return res.status(201).json({ success: true, message: 'İçerik oluşturuldu', id });
  } catch (error) {
    console.error('adminCreateContent error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Sunucu hatası' });
  }
};

const adminUpdateContent = async (req, res) => {
  try {
    const data = { ...req.body };

    if (req.files?.poster_image) data.poster_image = req.files.poster_image[0].filename;
    if (req.files?.banner_image) data.banner_image = req.files.banner_image[0].filename;

    const updated = await Content.update(req.params.id, data);
    if (!updated) return res.status(404).json({ success: false, message: 'İçerik bulunamadı' });
    return res.json({ success: true, message: 'İçerik güncellendi' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

const adminDeleteContent = async (req, res) => {
  try {
    const deleted = await Content.delete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'İçerik bulunamadı' });
    return res.json({ success: true, message: 'İçerik silindi' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const stats = await Content.getStats();
    const totalCategories = await Category.count();
    const totalComments = await Comment.count();

    const [topContents] = await pool.query(
      `SELECT id, title, slug, real_views, (real_views * 30) as display_views, like_count, poster_image
       FROM contents WHERE is_active = 1 ORDER BY real_views DESC LIMIT 5`
    );
    const [recentContents] = await pool.query(
      'SELECT id, title, slug, content_type, is_active, created_at FROM contents ORDER BY created_at DESC LIMIT 5'
    );
    const [recentComments] = await pool.query(
      `SELECT cm.*, ct.title as content_title FROM comments cm
       LEFT JOIN contents ct ON cm.content_id = ct.id
       ORDER BY cm.created_at DESC LIMIT 5`
    );

    return res.json({
      success: true,
      data: {
        ...stats,
        total_categories: totalCategories,
        total_comments: totalComments,
        top_contents: topContents,
        recent_contents: recentContents,
        recent_comments: recentComments
      }
    });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

module.exports = {
  getContents, getContentBySlug, recordView, toggleLike, addComment,
  adminGetContents, adminGetContent, adminCreateContent, adminUpdateContent, adminDeleteContent,
  getDashboardStats
};
