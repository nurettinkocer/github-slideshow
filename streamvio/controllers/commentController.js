/**
 * Comment Controller (Admin)
 */
const Comment = require('../models/Comment');
const Content = require('../models/Content');

const adminGetComments = async (req, res) => {
  try {
    const { status, search, contentId, limit = 20, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const comments = await Comment.getAll({
      status: status || null,
      search: search || null,
      contentId: contentId ? parseInt(contentId) : null,
      limit: parseInt(limit),
      offset
    });

    const total = await Comment.count(status || null);

    return res.json({ success: true, data: comments, pagination: { total, page: parseInt(page) } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

const adminUpdateCommentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['approved', 'pending', 'hidden'];
    if (!valid.includes(status)) {
      return res.status(400).json({ success: false, message: 'Geçersiz durum' });
    }

    await Comment.updateStatus(req.params.id, status);

    // Update content comment count
    const [comment] = await require('../config/database').pool.query(
      'SELECT content_id FROM comments WHERE id = ?', [req.params.id]
    );
    if (comment[0]) {
      await Content.updateCommentCount(comment[0].content_id);
    }

    return res.json({ success: true, message: 'Yorum durumu güncellendi' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

const adminDeleteComment = async (req, res) => {
  try {
    const deleted = await Comment.delete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Yorum bulunamadı' });
    return res.json({ success: true, message: 'Yorum silindi' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

const adminBulkDeleteComments = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ success: false, message: 'ID listesi zorunludur' });
    }

    const count = await Comment.deleteMultiple(ids);
    return res.json({ success: true, message: `${count} yorum silindi` });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

module.exports = { adminGetComments, adminUpdateCommentStatus, adminDeleteComment, adminBulkDeleteComments };
