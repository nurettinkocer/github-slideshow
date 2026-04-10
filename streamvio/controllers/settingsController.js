/**
 * Settings Controller
 */
const Setting = require('../models/Setting');

const getSiteSettings = async (req, res) => {
  try {
    const settings = await Setting.getAll('site_settings');
    return res.json({ success: true, data: settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

const getContactSettings = async (req, res) => {
  try {
    const settings = await Setting.getAll('contact_settings');
    return res.json({ success: true, data: settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

const updateSiteSettings = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.files?.logo) data.logo = req.files.logo[0].filename;
    if (req.files?.favicon) data.favicon = req.files.favicon[0].filename;

    await Setting.bulkUpdate(data, 'site_settings');
    return res.json({ success: true, message: 'Site ayarları güncellendi' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

const updateContactSettings = async (req, res) => {
  try {
    await Setting.bulkUpdate(req.body, 'contact_settings');
    return res.json({ success: true, message: 'İletişim bilgileri güncellendi' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

module.exports = { getSiteSettings, getContactSettings, updateSiteSettings, updateContactSettings };
