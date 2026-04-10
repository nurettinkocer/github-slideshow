/**
 * User Controller (Admin)
 */
const User = require('../models/User');
const { pool } = require('../config/database');

const adminGetUsers = async (req, res) => {
  try {
    const { search, role, limit = 20, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.getAll({ search, role, limit: parseInt(limit), offset });
    const total = await User.count();

    return res.json({ success: true, data: users, pagination: { total, page: parseInt(page) } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

const adminUpdateUser = async (req, res) => {
  try {
    const updated = await User.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
    return res.json({ success: true, message: 'Kullanıcı güncellendi' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

const adminDeleteUser = async (req, res) => {
  try {
    const deleted = await User.delete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
    return res.json({ success: true, message: 'Kullanıcı silindi' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// User self profile
const updateProfile = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.avatar = req.file.filename;
    delete data.role; // Cannot self-promote

    const updated = await User.update(req.user.id, data);
    if (!updated) return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
    return res.json({ success: true, message: 'Profil güncellendi' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

const toggleFavorite = async (req, res) => {
  try {
    const { contentId } = req.body;
    const userId = req.user.id;

    const [existing] = await pool.query(
      'SELECT id FROM favorites WHERE user_id = ? AND content_id = ?',
      [userId, contentId]
    );

    if (existing.length > 0) {
      await pool.query('DELETE FROM favorites WHERE user_id = ? AND content_id = ?', [userId, contentId]);
      return res.json({ success: true, added: false, message: 'Favorilerden çıkarıldı' });
    } else {
      await pool.query('INSERT INTO favorites (user_id, content_id) VALUES (?, ?)', [userId, contentId]);
      return res.json({ success: true, added: true, message: 'Favorilere eklendi' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

const toggleWatchlist = async (req, res) => {
  try {
    const { contentId } = req.body;
    const userId = req.user.id;

    const [existing] = await pool.query(
      'SELECT id FROM watchlists WHERE user_id = ? AND content_id = ?',
      [userId, contentId]
    );

    if (existing.length > 0) {
      await pool.query('DELETE FROM watchlists WHERE user_id = ? AND content_id = ?', [userId, contentId]);
      return res.json({ success: true, added: false, message: 'İzleme listesinden çıkarıldı' });
    } else {
      await pool.query('INSERT INTO watchlists (user_id, content_id) VALUES (?, ?)', [userId, contentId]);
      return res.json({ success: true, added: true, message: 'İzleme listesine eklendi' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

const getFavorites = async (req, res) => {
  try {
    const favorites = await User.getFavorites(req.user.id);
    return res.json({ success: true, data: favorites });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

const getWatchlist = async (req, res) => {
  try {
    const watchlist = await User.getWatchlist(req.user.id);
    return res.json({ success: true, data: watchlist });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

const getUserComments = async (req, res) => {
  try {
    const [comments] = await pool.query(
      `SELECT cm.*, ct.title as content_title, ct.slug as content_slug, ct.poster_image
       FROM comments cm
       LEFT JOIN contents ct ON cm.content_id = ct.id
       WHERE cm.user_id = ? ORDER BY cm.created_at DESC`,
      [req.user.id]
    );
    return res.json({ success: true, data: comments });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

module.exports = {
  adminGetUsers, adminUpdateUser, adminDeleteUser,
  updateProfile, toggleFavorite, toggleWatchlist,
  getFavorites, getWatchlist, getUserComments
};
