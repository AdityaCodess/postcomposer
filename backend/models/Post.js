// Inside backend/models/Post.js
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  platform: {
    type: String,
    required: true,
    enum: ['linkedin', 'twitter', 'instagram'],
  },
  content: {
    type: String,
  },
  media: {
    type: String, 
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'published', 'failed'], // Added new states
    default: 'published',
  },
  scheduledFor: {
    type: Date, 
    default: null,
  },
  errorLog: {
    type: String,
    default: null,
  }
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);