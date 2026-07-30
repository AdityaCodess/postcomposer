const express = require('express');
const router = express.Router();

const { 
  getPosts, 
  createPost, 
  toggleConnection, 
  getMe, 
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
router.get('/me', getMe);
router.post('/generate', generateAIPost); // 🚀 AI Endpoint mounted here

// ID-specific routes for CRUD
router.route('/:id')
  .put(updatePost)
  .delete(deletePost);

module.exports = router;