const express = require('express');
const router = express.Router();

const { 
  getPosts, 
  createPost, 
  toggleConnection, 
  getMe,
  deleteAccount, 
  updatePost, 
  deletePost,
  generateAIPost
} = require('../controllers/postController');

const { protect } = require('../middleware/authMiddleware');

router.use(protect); 

// Base Routes
router.route('/')
  .get(getPosts)
  .post(createPost);

// Custom Routes
router.post('/connections', toggleConnection);
router.post('/generate', generateAIPost);

// User Profile & Account Management
router.route('/me')
  .get(getMe)
  .delete(deleteAccount);

// ID-specific routes for CRUD
router.route('/:id')
  .put(updatePost)
  .delete(deletePost);

module.exports = router;