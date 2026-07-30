const Post = require('../models/Post');
const User = require('../models/User');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
      status: 'published'
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

// @desc    Generate post content using AI
// @route   POST /api/posts/generate
const generateAIPost = async (req, res) => {
  try {
    const { topic, platform } = req.body;
    
    if (!topic) {
      return res.status(400).json({ success: false, message: 'Please provide a topic for the AI.' });
    }

    // SWAPPED TO "gemini-2.5-flash-preview"
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });
    
    const prompt = `You are an expert social media manager. Write a professional, highly engaging post for ${platform} about the following topic: "${topic}". 
    Format it perfectly for ${platform} (use appropriate length, tone, formatting, and a few relevant hashtags). 
    Do not include introductory filler text like "Here is your post", just return the actual post content itself.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedText = response.text();

    res.status(200).json({ success: true, data: generatedText });
  } catch (error) {
    console.error('AI Generation Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate AI content.' });
  }
};

// @desc    Update an existing post
// @route   PUT /api/posts/:id
const updatePost = async (req, res) => {
  try {
    let post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized to update this post' });
    }

    post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update post' });
  }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this post' });
    }

    await post.deleteOne();
    res.status(200).json({ success: true, message: 'Post removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete post' });
  }
};

module.exports = { getPosts, createPost, toggleConnection, getMe, updatePost, deletePost, generateAIPost };