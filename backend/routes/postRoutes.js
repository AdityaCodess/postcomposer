const express = require('express');
const router = express.Router();

const { 
  getPosts, 
  createPost, 
  linkConnection,
  twitterCallback, 
  disconnectConnection,
  getMe,
  deleteAccount, 
  updatePost, 
  deletePost,
  generateAIPost
} = require('../controllers/postController');

const { protect } = require('../middleware/authMiddleware');

// Base Routes
router.route('/')
  .get(protect, getPosts)
  .post(protect, createPost);

// Custom AI Generation Route
router.post('/generate', protect, generateAIPost);

// OAuth Connection Routes
// NOTE: /link and /callback do NOT use the protect middleware because they are browser redirects.
// Token validation is handled manually inside the controller for these specific routes.
router.get('/connections/:platform/link', linkConnection);
router.get('/connections/twitter/callback', twitterCallback);
router.post('/connections/disconnect', protect, disconnectConnection);

// User Profile & Account Management
router.route('/me')
  .get(protect, getMe)
  .delete(protect, deleteAccount);

// ID-specific routes for CRUD operations
router.route('/:id')
  .put(protect, updatePost)
  .delete(protect, deletePost);

module.exports = router;