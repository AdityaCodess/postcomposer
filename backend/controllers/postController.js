const Post = require('../models/Post');
const User = require('../models/User');

// @desc    Get user's post history
// @route   GET /api/posts
const getPosts = async (req, res) => {
  try {
    const posts = await Post.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: posts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create and deploy a new post
// @route   POST /api/posts
const createPost = async (req, res) => {
  try {
    const { platform, content, media } = req.body;

    if (!content && !media) {
      return res.status(400).json({ success: false, message: 'Content or media is required' });
    }

    const post = await Post.create({
      user: req.user._id,
      platform,
      content,
      media,
      status: 'published' // Assuming successful deployment for now
    });

    res.status(201).json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to deploy post' });
  }
};

// @desc    Toggle a social media connection
// @route   POST /api/posts/connections
const toggleConnection = async (req, res) => {
  try {
    const { platform } = req.body;
    const user = await User.findById(req.user._id);
    
    if (user.linkedAccounts[platform] !== undefined) {
      user.linkedAccounts[platform] = !user.linkedAccounts[platform];
      await user.save();
    }
    
    res.status(200).json({ success: true, data: user.linkedAccounts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update connection' });
  }
};

// @desc    Get user profile data (including connections)
// @route   GET /api/posts/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = { getPosts, createPost, toggleConnection, getMe };