const express = require('express');
const router = express.Router();
const { getPosts, createPost, toggleConnection, getMe } = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');

// All post routes require the user to be logged in
router.use(protect); 

router.route('/').get(getPosts).post(createPost);
router.post('/connections', toggleConnection);
router.get('/me', getMe);

module.exports = router;