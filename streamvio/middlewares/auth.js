/**
 * Authentication Middleware
 */
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');

// Admin JWT auth middleware
const adminAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.adminToken || req.headers?.authorization?.split(' ')[1];

    if (!token) {
      if (req.path.startsWith('/api/')) {
        return res.status(401).json({ success: false, message: 'Yetkilendirme gerekli' });
      }
      return res.redirect('/admin/login');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.getById(decoded.id);

    if (!admin || !admin.is_active) {
      if (req.path.startsWith('/api/')) {
        return res.status(401).json({ success: false, message: 'Geçersiz oturum' });
      }
      res.clearCookie('adminToken');
      return res.redirect('/admin/login');
    }

    req.admin = admin;
    next();
  } catch (error) {
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ success: false, message: 'Geçersiz token' });
    }
    res.clearCookie('adminToken');
    return res.redirect('/admin/login');
  }
};

// User JWT auth middleware (optional - doesn't block)
const userAuthOptional = async (req, res, next) => {
  try {
    const token = req.cookies?.userToken || req.headers?.authorization?.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.getById(decoded.id);
      if (user && user.is_active) {
        req.user = user;
      }
    }
  } catch (error) {
    // Token invalid, continue as guest
  }
  next();
};

// User auth required middleware
const userAuthRequired = async (req, res, next) => {
  try {
    const token = req.cookies?.userToken || req.headers?.authorization?.split(' ')[1];

    if (!token) {
      if (req.path.startsWith('/api/')) {
        return res.status(401).json({ success: false, message: 'Giriş yapmanız gerekli' });
      }
      return res.redirect('/giris?redirect=' + encodeURIComponent(req.path));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.getById(decoded.id);

    if (!user || !user.is_active) {
      if (req.path.startsWith('/api/')) {
        return res.status(401).json({ success: false, message: 'Geçersiz oturum' });
      }
      res.clearCookie('userToken');
      return res.redirect('/giris');
    }

    req.user = user;
    next();
  } catch (error) {
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ success: false, message: 'Geçersiz token' });
    }
    res.clearCookie('userToken');
    return res.redirect('/giris');
  }
};

module.exports = { adminAuth, userAuthOptional, userAuthRequired };
