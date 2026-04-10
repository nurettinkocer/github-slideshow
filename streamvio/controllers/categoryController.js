/**
 * Category Controller
 */
const Category = require('../models/Category');
const Content = require('../models/Content');
const slugify = require('slugify');

const getCategories = async (req, res) => {
  try {
    const categories = await Category.getAll({ activeOnly: true });
    return res.json({ success: true, data: categories });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

const getCategoryBySlug = async (req, res) => {
  try {
    const category = await Category.getBySlug(req.params.slug);
    if (!category) return res.status(404).json({ success: false, message: 'Kategori bulunamadı' });

    const contents = await Content.getAll({
      activeOnly: true,
      categoryId: category.id,
      limit: 20,
      offset: 0
    });

    return res.json({ success: true, data: { category, contents } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Admin
const adminGetCategories = async (req, res) => {
  try {
    const categories = await Category.getAll({ activeOnly: false });
    return res.json({ success: true, data: categories });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

const adminCreateCategory = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.cover_image = req.file.filename;

    if (!data.name) return res.status(400).json({ success: false, message: 'Kategori adı zorunludur' });

    data.slug = data.slug || slugify(data.name, { lower: true, strict: true, locale: 'tr' });

    const id = await Category.create(data);
    return res.status(201).json({ success: true, message: 'Kategori oluşturuldu', id });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Bu slug zaten kullanımda' });
    }
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

const adminUpdateCategory = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.cover_image = req.file.filename;

    const updated = await Category.update(req.params.id, data);
    if (!updated) return res.status(404).json({ success: false, message: 'Kategori bulunamadı' });

    return res.json({ success: true, message: 'Kategori güncellendi' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

const adminDeleteCategory = async (req, res) => {
  try {
    const deleted = await Category.delete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Kategori bulunamadı' });
    return res.json({ success: true, message: 'Kategori silindi' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

module.exports = {
  getCategories, getCategoryBySlug,
  adminGetCategories, adminCreateCategory, adminUpdateCategory, adminDeleteCategory
};
