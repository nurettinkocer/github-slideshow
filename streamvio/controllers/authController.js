/**
 * Auth Controller
 * Handles login/register for both users and admins
 */
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');

// Generate JWT token
const generateToken = (payload, expiresIn = '7d') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

// ==================== ADMIN ====================

// Admin login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email ve şifre zorunludur' });
    }

    const admin = await Admin.getByEmail(email);
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Email veya şifre hatalı' });
    }

    const isValid = await Admin.verifyPassword(password, admin.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Email veya şifre hatalı' });
    }

    await Admin.updateLastLogin(admin.id);

    const token = generateToken({ id: admin.id, role: admin.role, type: 'admin' });

    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'strict'
    });

    return res.json({
      success: true,
      message: 'Giriş başarılı',
      token,
      admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Admin logout
const adminLogout = (req, res) => {
  res.clearCookie('adminToken');
  return res.json({ success: true, message: 'Çıkış yapıldı' });
};

// ==================== USER ====================

// User register
const userRegister = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Tüm alanlar zorunludur' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Şifre en az 6 karakter olmalıdır' });
    }

    const existingUser = await User.getByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Bu email zaten kayıtlı' });
    }

    const userId = await User.create({ name, email, password });

    const token = generateToken({ id: userId, type: 'user' });

    res.cookie('userToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'strict'
    });

    return res.status(201).json({
      success: true,
      message: 'Kayıt başarılı',
      token,
      user: { id: userId, name, email, role: 'user' }
    });
  } catch (error) {
    console.error('User register error:', error);
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// User login
const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email ve şifre zorunludur' });
    }

    const user = await User.getByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email veya şifre hatalı' });
    }

    if (!user.is_active) {
      return res.status(401).json({ success: false, message: 'Hesabınız devre dışı bırakılmış' });
    }

    const isValid = await User.verifyPassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Email veya şifre hatalı' });
    }

    await User.updateLastLogin(user.id);

    const token = generateToken({ id: user.id, type: 'user' });

    res.cookie('userToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'strict'
    });

    return res.json({
      success: true,
      message: 'Giriş başarılı',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('User login error:', error);
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// User logout
const userLogout = (req, res) => {
  res.clearCookie('userToken');
  return res.json({ success: true, message: 'Çıkış yapıldı' });
};

// Get current user
const getMe = async (req, res) => {
  try {
    const user = await User.getById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
    }
    return res.json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

module.exports = { adminLogin, adminLogout, userRegister, userLogin, userLogout, getMe };
