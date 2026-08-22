const express = require('express');
const router = express.Router();

const { 
  getPosts, 
  createPost, 
  linkConnection,
  twitterCallback,
  linkedinCallback,
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
router.get('/connections/:platform/link', linkConnection);
router.get('/connections/twitter/callback', twitterCallback);
router.get('/connections/linkedin/callback', linkedinCallback);
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