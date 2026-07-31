const Post = require('../models/Post');
const User = require('../models/User');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const jwt = require('jsonwebtoken');
const { TwitterApi } = require('twitter-api-v2');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize Twitter Client (OAuth 2.0)
const twitterClient = new TwitterApi({
  clientId: process.env.TWITTER_CLIENT_ID,
  clientSecret: process.env.TWITTER_CLIENT_SECRET,
});

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

    const user = await User.findById(req.user._id);

    // If platform is Twitter, push it live to the actual API
    if (platform === 'twitter') {
      if (!user.twitterTokens || !user.twitterTokens.accessToken) {
        return res.status(401).json({ success: false, message: 'Twitter account not linked' });
      }

      // Create a user-specific client using their stored token
      const userTwitterClient = new TwitterApi(user.twitterTokens.accessToken);
      
      try {
        // Publish the real tweet
        await userTwitterClient.v2.tweet(content);
      } catch (twitterErr) {
        // DETAILED LOGGING: This will print the exact Twitter API rejection reason in Render logs
        console.error("Twitter API Error Details:", JSON.stringify(twitterErr.data || twitterErr.message, null, 2));
        return res.status(500).json({ 
          success: false, 
          message: twitterErr.data?.detail || 'Failed to publish to Twitter live feed.' 
        });
      }
    }

    // Save to our own database history
    const post = await Post.create({
      user: req.user._id,
      platform,
      content,
      media,
      status: 'published'
    });
    
    res.status(201).json({ success: true, data: post });
  } catch (error) {
    console.error("Create Post Server Error:", error);
    res.status(500).json({ success: false, message: 'Failed to deploy post' });
  }
};

const linkConnection = async (req, res) => {
  const { platform } = req.params;
  const { token } = req.query; 
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (platform === 'twitter') {
      // Generate real secure OAuth 2.0 PKCE link
      const callbackUrl = `${process.env.BACKEND_URL}/api/posts/connections/twitter/callback`;
      const { url, codeVerifier, state } = twitterClient.generateOAuth2AuthLink(
        callbackUrl, 
        { scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'] }
      );

      // Directly update the DB to avoid missing password validation errors
      await User.findByIdAndUpdate(decoded.id, {
        twitterOAuth: { codeVerifier, state }
      });

      // Physically redirect browser to the real Twitter login screen
      return res.redirect(url);
    }
    
    // Fallback for other platforms
    await User.findByIdAndUpdate(decoded.id, {
      [`linkedAccounts.${platform}`]: true
    });
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendURL}?linked=${platform}`);

  } catch (error) {
    console.error('Link Connection Error:', error);
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendURL}?error=auth_failed`);
  }
};

const twitterCallback = async (req, res) => {
  const { state, code } = req.query;
  const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';

  try {
    // Find which user initiated this exact auth flow using the unique state string
    const user = await User.findOne({ 'twitterOAuth.state': state });
    if (!user) return res.redirect(`${frontendURL}?error=invalid_state`);

    // Exchange the temporary code for permanent API tokens
    const callbackUrl = `${process.env.BACKEND_URL}/api/posts/connections/twitter/callback`;
    const { client: loggedClient, accessToken, refreshToken } = await twitterClient.loginWithOAuth2({
      code,
      codeVerifier: user.twitterOAuth.codeVerifier,
      redirectUri: callbackUrl,
    });

    // Directly update the DB with tokens and wipe the temporary security strings
    await User.findByIdAndUpdate(user._id, {
      twitterTokens: { accessToken, refreshToken },
      'linkedAccounts.twitter': true,
      $unset: { twitterOAuth: "" } // Removes the field entirely
    });

    // Send back to the React app
    res.redirect(`${frontendURL}?linked=twitter`);
  } catch (error) {
    console.error('OAuth Callback Error:', error);
    res.redirect(`${frontendURL}?error=twitter_callback_failed`);
  }
};

const disconnectConnection = async (req, res) => {
  try {
    const { platform } = req.body;
    
    const updateQuery = {
      $set: { [`linkedAccounts.${platform}`]: false }
    };

    if (platform === 'twitter') {
      updateQuery.$unset = { twitterTokens: "" };
    }

    await User.findByIdAndUpdate(req.user._id, updateQuery);
    
    const updatedUser = await User.findById(req.user._id);
    res.status(200).json({ success: true, data: updatedUser.linkedAccounts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to disconnect' });
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

const deleteAccount = async (req, res) => {
  try {
    await Post.deleteMany({ user: req.user._id });
    await User.findByIdAndDelete(req.user._id);
    res.status(200).json({ success: true, message: 'Account and all data permanently deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete account' });
  }
};

const generateAIPost = async (req, res) => {
  try {
    const { topic, platform } = req.body;
    if (!topic) return res.status(400).json({ success: false, message: 'Please provide a topic for the AI.' });

    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });
    const prompt = `You are an expert social media manager. Write a professional, highly engaging post for ${platform} about the following topic: "${topic}". 
    Format it perfectly for ${platform} (use appropriate length, tone, formatting, and a few relevant hashtags). 
    Do not include introductory filler text like "Here is your post", just return the actual post content itself.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedText = response.text();

    res.status(200).json({ success: true, data: generatedText });
  } catch (error) {
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

module.exports = { 
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
};