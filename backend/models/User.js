const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  resetOtp: {
    type: String,
    default: null
  },
  resetOtpExpiry: {
    type: Date,
    default: null
  },
  linkedAccounts: {
    twitter: { type: Boolean, default: false },
    linkedin: { type: Boolean, default: false },
    instagram: { type: Boolean, default: false },
  },
  twitterTokens: {
    accessToken: { type: String },
    refreshToken: { type: String },
  },
  twitterOAuth: {
    state: { type: String },
    codeVerifier: { type: String },
  },
  // LinkedIn Storage
  linkedinTokens: {
    accessToken: { type: String },
  },
  linkedinOAuth: {
    state: { type: String },
  },
  linkedinId: { 
    type: String // Stores the user's unique URN required for posting
  },
  subscription: {
    plan: { 
      type: String, 
      enum: ['free', 'creator', 'pro'], 
      default: 'free' 
    },
    status: { 
      type: String, 
      enum: ['active', 'canceled', 'past_due'], 
      default: 'active' 
    },
    aiCreditsRemaining: { 
      type: Number, 
      default: 10 // Updated free tier quota to 10
    },
    linkedinPostsThisMonth: { 
      type: Number, 
      default: 0 
    },
    billingCycleReset: { 
      type: Date, 
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
    },
    stripeCustomerId: { type: String, default: null },
    stripeSubscriptionId: { type: String, default: null }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);