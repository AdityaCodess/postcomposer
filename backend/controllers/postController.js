const Post = require('../models/Post');
const User = require('../models/User');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const jwt = require('jsonwebtoken');
const { TwitterApi } = require('twitter-api-v2');
const axios = require('axios'); 

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize Twitter Client
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
    // Extract scheduledFor from the request body
    const { platform, content, media, scheduledFor } = req.body;
    if (!content && !media) return res.status(400).json({ success: false, message: 'Content or media is required' });

    const user = await User.findById(req.user._id);
    
    // Safely check admin status
    const isAdmin = user.email === (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const plan = user.subscription?.plan || 'free';
    const linkedinCount = user.subscription?.linkedinPostsThisMonth || 0;

    // 1. Block Instagram
    if (platform === 'instagram') {
      return res.status(400).json({ success: false, message: 'Instagram integration is coming soon!' });
    }

    // 2. Enforce Twitter limits
    if (platform === 'twitter' && plan === 'free' && !isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Twitter publishing is reserved for Creator & Agentic Pro plans. Upgrade to unlock.' 
      });
    }
    
    // 3. Enforce LinkedIn limits
    if (platform === 'linkedin' && !isAdmin) {
      let limit = 28; // Default free
      if (plan === 'creator') limit = 700;
      if (plan === 'Agentic Pro') limit = 10000;
      
      if (linkedinCount >= limit) {
        return res.status(403).json({ 
          success: false, 
          message: `You have reached your limit of ${limit} LinkedIn posts this month. Please upgrade your plan to continue publishing.` 
        });
      }
    }

    const isScheduled = scheduledFor && new Date(scheduledFor) > new Date();

    // ONLY execute the APIs and deduct quotas if it's an immediate post
    if (!isScheduled) {
      
      // -- TWITTER DEPLOYMENT --
      if (platform === 'twitter') {
        if (!user.twitterTokens || !user.twitterTokens.accessToken) {
          return res.status(401).json({ success: false, message: 'Twitter account not linked' });
        }
        const userTwitterClient = new TwitterApi(user.twitterTokens.accessToken);
        
        try {
          await userTwitterClient.v2.tweet(content || "Media upload initiated via Postifye.");
        } catch (twitterErr) {
          console.error("Twitter API Error Details:", JSON.stringify(twitterErr.data || twitterErr.message, null, 2));
          return res.status(500).json({ success: false, message: 'Twitter API rejected the post.' });
        }
      }

      // -- LINKEDIN DEPLOYMENT --
      if (platform === 'linkedin') {
        if (!user.linkedinTokens || !user.linkedinTokens.accessToken || !user.linkedinId) {
          return res.status(401).json({ success: false, message: 'LinkedIn account not linked' });
        }
        
        try {
          let linkedinPostData = {
            author: `urn:li:person:${user.linkedinId}`,
            lifecycleState: "PUBLISHED",
            specificContent: {
              "com.linkedin.ugc.ShareContent": {
                shareCommentary: { text: content || "" },
                shareMediaCategory: "NONE"
              }
            },
            visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" }
          };

          if (media) {
            const mimeType = media.split(';')[0].split(':')[1];
            const base64Data = media.split(',')[1];
            const imageBuffer = Buffer.from(base64Data, 'base64');

            const registerResponse = await axios.post('https://api.linkedin.com/v2/assets?action=registerUpload', {
              registerUploadRequest: {
                recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
                owner: `urn:li:person:${user.linkedinId}`,
                serviceRelationships: [{
                  relationshipType: 'OWNER',
                  identifier: 'urn:li:userGeneratedContent'
                }]
              }
            }, {
              headers: {
                'Authorization': `Bearer ${user.linkedinTokens.accessToken}`,
                'Content-Type': 'application/json'
              }
            });

            const uploadUrl = registerResponse.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
            const assetUrn = registerResponse.data.value.asset;

            await axios.put(uploadUrl, imageBuffer, {
              headers: {
                'Authorization': `Bearer ${user.linkedinTokens.accessToken}`,
                'Content-Type': mimeType
              }
            });

            linkedinPostData.specificContent["com.linkedin.ugc.ShareContent"].shareMediaCategory = "IMAGE";
            linkedinPostData.specificContent["com.linkedin.ugc.ShareContent"].media = [
              {
                status: "READY",
                description: { text: "Uploaded via Postifye Composer" },
                media: assetUrn,
                title: { text: "Postifye Media Attachment" }
              }
            ];
          }

          await axios.post('https://api.linkedin.com/v2/ugcPosts', linkedinPostData, {
            headers: {
              'Authorization': `Bearer ${user.linkedinTokens.accessToken}`,
              'X-Restli-Protocol-Version': '2.0.0',
              'Content-Type': 'application/json'
            }
          });
          
        } catch (linkedinErr) {
          console.error("LinkedIn API Error:", linkedinErr.response?.data || linkedinErr.message);
          return res.status(500).json({ success: false, message: 'Failed to publish to LinkedIn live feed.' });
        }
      }

      if (platform === 'linkedin') {
        await User.findByIdAndUpdate(req.user._id, {
          $inc: { 'subscription.linkedinPostsThisMonth': 1 }
        });
      }
    } 
    const post = await Post.create({
      user: req.user._id,
      platform,
      content,
      media,
      status: isScheduled ? 'scheduled' : 'published',
      scheduledFor: isScheduled ? new Date(scheduledFor) : null
    });
    
    res.status(201).json({ success: true, data: post });
  } catch (error) {
    console.error("Create Post Server Error:", error);
    res.status(500).json({ success: false, message: 'Failed to deploy post' });
  }
};

const generateAIPost = async (req, res) => {
  try {
    const { topic, platform, tone = 'Professional', preset = 'Standard'} = req.body;
    if (!topic) return res.status(400).json({ success: false, message: 'Please provide a topic for the AI.' });

    const user = await User.findById(req.user._id);
    const plan = user.subscription?.plan || 'free';
    const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const userEmail = (user.email || '').trim().toLowerCase();
    const isAdmin = userEmail === adminEmail;

    let systemInstruction = `You are an expert social media copywriter. Write a ${platform} post about the following topic: "${topic}". `;
    
    if (preset === 'Thought Leadership') systemInstruction += "Structure it as a thought leadership piece: start with a strong hook, offer a unique perspective or counter-narrative, and end with an open question. ";
    if (preset === 'Project Showcase') systemInstruction += "Structure it as a project showcase: highlight the problem, explain the technical solution concisely, and share the results/learnings. ";
    if (preset === 'Storytelling') systemInstruction += "Structure it as a personal story: start with a relatable struggle or realization, explain the journey, and end with an inspiring takeaway. ";
    systemInstruction += `The tone should be ${tone}. `;
    if (platform === 'twitter') systemInstruction += "Keep it strictly under 280 characters and use 1-2 relevant hashtags.";
    

    if (!user.subscription) {
      user.subscription = { plan: 'free', aiCreditsRemaining: 10, linkedinPostsThisMonth: 0 };
    }
    
    // UPDATED: Initialize credits based on new plan caps
    let aiCredits = user.subscription.aiCreditsRemaining;
    if (aiCredits === undefined || aiCredits === null) {
      if (plan === 'Agentic Pro') aiCredits = 30000;
      else if (plan === 'creator') aiCredits = 1000;
      else aiCredits = 10;
      user.subscription.aiCreditsRemaining = aiCredits;
    }

    // Block if out of credits (Unless Admin)
    if (aiCredits <= 0 && !isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'AI generation quota reached for this billing period. Upgrade your plan to continue.' 
      });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });
    const prompt = `${systemInstruction}
    Do not include introductory filler text like "Here is your post", just return the actual post content itself.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedText = response.text();

    // Deduct Credit and save explicitly (Unless Admin)
    if (!isAdmin) {
      user.subscription.aiCreditsRemaining = Math.max(0, aiCredits - 1);
      await user.save();
    }

    res.status(200).json({ 
      success: true, 
      data: generatedText, 
      remainingCredits: isAdmin ? '∞' : user.subscription.aiCreditsRemaining 
    });
  } catch (error) {
    console.error("AI Generation Error:", error);
    res.status(500).json({ success: false, message: 'Failed to generate AI content.' });
  }
};


const linkConnection = async (req, res) => {
  const { platform } = req.params;
  const { token } = req.query; 
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // TWITTER LINK
    if (platform === 'twitter') {
      const callbackUrl = `${process.env.BACKEND_URL}/api/posts/connections/twitter/callback`;
      const { url, codeVerifier, state } = twitterClient.generateOAuth2AuthLink(
        callbackUrl, 
        { scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'] }
      );
      await User.findByIdAndUpdate(decoded.id, { twitterOAuth: { codeVerifier, state } });
      return res.redirect(url);
    }
    
    // LINKEDIN LINK
    if (platform === 'linkedin') {
      const callbackUrl = `${process.env.BACKEND_URL}/api/posts/connections/linkedin/callback`;
      const state = Math.random().toString(36).substring(7); 
      
      const linkedinAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(callbackUrl)}&state=${state}&scope=w_member_social%20openid%20profile%20email&enable_extended_login=true`;
      await User.findByIdAndUpdate(decoded.id, { linkedinOAuth: { state } });
      return res.redirect(linkedinAuthUrl);
    }

    // Fallback
    await User.findByIdAndUpdate(decoded.id, { [`linkedAccounts.${platform}`]: true });
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
    const user = await User.findOne({ 'twitterOAuth.state': state });
    if (!user) return res.redirect(`${frontendURL}?error=invalid_state`);

    const callbackUrl = `${process.env.BACKEND_URL}/api/posts/connections/twitter/callback`;
    const { accessToken, refreshToken } = await twitterClient.loginWithOAuth2({
      code,
      codeVerifier: user.twitterOAuth.codeVerifier,
      redirectUri: callbackUrl,
    });

    await User.findByIdAndUpdate(user._id, {
      twitterTokens: { accessToken, refreshToken },
      'linkedAccounts.twitter': true,
      $unset: { twitterOAuth: "" }
    });

    res.redirect(`${frontendURL}?linked=twitter`);
  } catch (error) {
    res.redirect(`${frontendURL}?error=twitter_callback_failed`);
  }
};

const linkedinCallback = async (req, res) => {
  const { state, code } = req.query;
  const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';

  try {
    const user = await User.findOne({ 'linkedinOAuth.state': state });
    if (!user) return res.redirect(`${frontendURL}?error=invalid_state`);

    const callbackUrl = `${process.env.BACKEND_URL}/api/posts/connections/linkedin/callback`;
    
    const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      client_id: process.env.LINKEDIN_CLIENT_ID,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      redirect_uri: callbackUrl
    }).toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const accessToken = tokenResponse.data.access_token;

    const profileResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    const linkedinId = profileResponse.data.sub;

    await User.findByIdAndUpdate(user._id, {
      linkedinTokens: { accessToken },
      linkedinId: linkedinId,
      'linkedAccounts.linkedin': true,
      $unset: { linkedinOAuth: "" }
    });

    res.redirect(`${frontendURL}?linked=linkedin`);
  } catch (error) {
    console.error('LinkedIn Callback Error:', error.response?.data || error.message);
    res.redirect(`${frontendURL}?error=linkedin_callback_failed`);
  }
};

const disconnectConnection = async (req, res) => {
  try {
    const { platform } = req.body;
    const updateQuery = { $set: { [`linkedAccounts.${platform}`]: false } };

    if (platform === 'twitter') updateQuery.$unset = { twitterTokens: "" };
    if (platform === 'linkedin') updateQuery.$unset = { linkedinTokens: "", linkedinId: "" };

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
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const userEmail = (user.email || '').trim().toLowerCase();
    const isAdmin = adminEmail && (userEmail === adminEmail);

    // Convert to plain object
    let userData = user.toObject();

    // If admin, dynamically grant Agentic Pro specs and infinite-feeling quotas if not already set
    if (isAdmin) {
      userData.subscription = {
        ...userData.subscription,
        plan: 'Agentic Pro',
        aiCreditsRemaining: userData.subscription?.aiCreditsRemaining ?? 30000,
        linkedinPostsThisMonth: userData.subscription?.linkedinPostsThisMonth ?? 0
      };
    }

    res.status(200).json({ success: true, data: userData });
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
// Get User Analytics
const getAnalytics = async (req, res) => {
  try {
    const posts = await Post.find({ user: req.user.id });

    // Basic Aggregation
    const totalPosts = posts.length;
    const published = posts.filter(p => p.status === 'published').length;
    const scheduled = posts.filter(p => p.status === 'scheduled').length;
    
    // Platform Breakdown
    const linkedinCount = posts.filter(p => p.platform === 'linkedin').length;
    const twitterCount = posts.filter(p => p.platform === 'twitter').length;

    // Generate mock engagement trend data (Last 7 Days)
    // In a production app, you would fetch real stats from LinkedIn/Twitter APIs here
    const chartData = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        impressions: Math.floor(Math.random() * 500) + 100,
        engagement: Math.floor(Math.random() * 50) + 10
      };
    });

    res.status(200).json({ 
      success: true, 
      data: { totalPosts, published, scheduled, linkedinCount, twitterCount, chartData } 
    });
  } catch (error) {
    console.error("Analytics Error:", error);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
};

module.exports = { 
  getPosts, createPost, linkConnection, 
  twitterCallback, linkedinCallback, 
  disconnectConnection, getMe, deleteAccount, 
  updatePost, deletePost, generateAIPost, getAnalytics
};