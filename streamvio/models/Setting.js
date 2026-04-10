/**
 * Settings Model
 * Manages site and contact settings
 */
const { pool } = require('../config/database');

class Setting {
  // Get all settings as key-value object
  static async getAll(table = 'site_settings') {
    const validTables = ['site_settings', 'contact_settings'];
    if (!validTables.includes(table)) return {};

    const [rows] = await pool.query(`SELECT setting_key, setting_value FROM ${table}`);
    const settings = {};
    rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });
    return settings;
  }

  // Get all rows (for admin management)
  static async getAllRows(table = 'site_settings') {
    const validTables = ['site_settings', 'contact_settings'];
    if (!validTables.includes(table)) return [];
    const [rows] = await pool.query(`SELECT * FROM ${table} ORDER BY id ASC`);
    return rows;
  }

  // Get single setting by key
  static async get(key, table = 'site_settings') {
    const validTables = ['site_settings', 'contact_settings'];
    if (!validTables.includes(table)) return null;

    const [rows] = await pool.query(
      `SELECT setting_value FROM ${table} WHERE setting_key = ?`,
      [key]
    );
    return rows[0] ? rows[0].setting_value : null;
  }

  // Set / update a setting
  static async set(key, value, table = 'site_settings') {
    const validTables = ['site_settings', 'contact_settings'];
    if (!validTables.includes(table)) return false;

    await pool.query(
      `INSERT INTO ${table} (setting_key, setting_value)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [key, value]
    );
    return true;
  }

  // Bulk update settings
  static async bulkUpdate(settings, table = 'site_settings') {
    const validTables = ['site_settings', 'contact_settings'];
    if (!validTables.includes(table)) return false;

    for (const [key, value] of Object.entries(settings)) {
      await Setting.set(key, value, table);
    }
    return true;
  }
}

module.exports = Setting;
