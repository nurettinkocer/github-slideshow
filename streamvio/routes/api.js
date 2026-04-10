/**
 * Public API Routes
 */
const express = require('express');
const router = express.Router();

const { adminAuth, userAuthOptional, userAuthRequired } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

const authCtrl = require('../controllers/authController');
const contentCtrl = require('../controllers/contentController');
const categoryCtrl = require('../controllers/categoryController');
const settingsCtrl = require('../controllers/settingsController');
const userCtrl = require('../controllers/userController');
const commentCtrl = require('../controllers/commentController');

// ==================== AUTH ====================
router.post('/auth/login', authCtrl.userLogin);
router.post('/auth/register', authCtrl.userRegister);
router.post('/auth/logout', authCtrl.userLogout);
router.get('/auth/me', userAuthRequired, authCtrl.getMe);

// Admin auth
router.post('/admin/auth/login', authCtrl.adminLogin);
router.post('/admin/auth/logout', adminAuth, authCtrl.adminLogout);

// ==================== CATEGORIES ====================
router.get('/categories', categoryCtrl.getCategories);
router.get('/categories/:slug', categoryCtrl.getCategoryBySlug);

// Admin categories
router.get('/admin/categories', adminAuth, categoryCtrl.adminGetCategories);
router.post('/admin/categories', adminAuth, upload.single('cover_image'), categoryCtrl.adminCreateCategory);
router.put('/admin/categories/:id', adminAuth, upload.single('cover_image'), categoryCtrl.adminUpdateCategory);
router.delete('/admin/categories/:id', adminAuth, categoryCtrl.adminDeleteCategory);

// ==================== CONTENTS ====================
router.get('/contents', userAuthOptional, contentCtrl.getContents);
router.get('/contents/:slug', userAuthOptional, contentCtrl.getContentBySlug);
router.post('/contents/:id/view', userAuthOptional, contentCtrl.recordView);
router.post('/contents/:id/like', userAuthOptional, contentCtrl.toggleLike);
router.post('/contents/:id/comment', userAuthOptional, contentCtrl.addComment);

// Admin contents
router.get('/admin/contents', adminAuth, contentCtrl.adminGetContents);
router.get('/admin/contents/:id', adminAuth, contentCtrl.adminGetContent);
router.post('/admin/contents', adminAuth,
  upload.fields([{ name: 'poster_image', maxCount: 1 }, { name: 'banner_image', maxCount: 1 }]),
  contentCtrl.adminCreateContent
);
router.put('/admin/contents/:id', adminAuth,
  upload.fields([{ name: 'poster_image', maxCount: 1 }, { name: 'banner_image', maxCount: 1 }]),
  contentCtrl.adminUpdateContent
);
router.delete('/admin/contents/:id', adminAuth, contentCtrl.adminDeleteContent);

// ==================== COMMENTS (ADMIN) ====================
router.get('/admin/comments', adminAuth, commentCtrl.adminGetComments);
router.put('/admin/comments/:id/status', adminAuth, commentCtrl.adminUpdateCommentStatus);
router.delete('/admin/comments/:id', adminAuth, commentCtrl.adminDeleteComment);
router.delete('/admin/comments/bulk', adminAuth, commentCtrl.adminBulkDeleteComments);

// ==================== USERS (ADMIN) ====================
router.get('/admin/users', adminAuth, userCtrl.adminGetUsers);
router.put('/admin/users/:id', adminAuth, userCtrl.adminUpdateUser);
router.delete('/admin/users/:id', adminAuth, userCtrl.adminDeleteUser);

// ==================== USER PROFILE ====================
router.put('/user/profile', userAuthRequired, upload.single('avatar'), userCtrl.updateProfile);
router.get('/user/favorites', userAuthRequired, userCtrl.getFavorites);
router.post('/user/favorites', userAuthRequired, userCtrl.toggleFavorite);
router.get('/user/watchlist', userAuthRequired, userCtrl.getWatchlist);
router.post('/user/watchlist', userAuthRequired, userCtrl.toggleWatchlist);
router.get('/user/comments', userAuthRequired, userCtrl.getUserComments);

// ==================== SETTINGS ====================
router.get('/settings/site', settingsCtrl.getSiteSettings);
router.get('/settings/contact', settingsCtrl.getContactSettings);
router.put('/admin/settings/site', adminAuth,
  upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'favicon', maxCount: 1 }]),
  settingsCtrl.updateSiteSettings
);
router.put('/admin/settings/contact', adminAuth, settingsCtrl.updateContactSettings);

// ==================== DASHBOARD ====================
router.get('/admin/dashboard/stats', adminAuth, contentCtrl.getDashboardStats);

module.exports = router;
