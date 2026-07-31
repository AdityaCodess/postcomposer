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
  linkedAccounts: {
    twitter: { type: Boolean, default: false },
    linkedin: { type: Boolean, default: false },
    instagram: { type: Boolean, default: false },
  },
  // NEW: Twitter OAuth Storage Fields
  twitterTokens: {
    accessToken: { type: String },
    refreshToken: { type: String },
  },
  twitterOAuth: {
    state: { type: String },
    codeVerifier: { type: String },
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);