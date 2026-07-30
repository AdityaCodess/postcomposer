const Post = require('../models/Post');
const User = require('../models/User');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getPosts = async (req, res) => {
  try {
    const posts = await Post.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: posts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const createPost = async (req, res) => {
  try {
    const { platform, content, media } = req.body;
    if (!content && !media) return res.status(400).json({ success: false, message: 'Content or media is required' });

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

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// NEW: Wipe account and all associated posts
const deleteAccount = async (req, res) => {
  try {
    await Post.deleteMany({ user: req.user._id });
    await User.findByIdAndDelete(req.user._id);
    res.status(200).json({ success: true, message: 'Account and all data permanently deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to delete account' });
  }
};

const generateAIPost = async (req, res) => {
  try {
    const { topic, platform } = req.body;
    if (!topic) return res.status(400).json({ success: false, message: 'Please provide a topic for the AI.' });

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview" });
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

const updatePost = async (req, res) => {
  try {
    let post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    if (post.user.toString() !== req.user._id.toString()) return res.status(401).json({ success: false, message: 'Not authorized' });

    post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update post' });
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    if (post.user.toString() !== req.user._id.toString()) return res.status(401).json({ success: false, message: 'Not authorized' });

    await post.deleteOne();
    res.status(200).json({ success: true, message: 'Post removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete post' });
  }
};

module.exports = { getPosts, createPost, toggleConnection, getMe, deleteAccount, updatePost, deletePost, generateAIPost };