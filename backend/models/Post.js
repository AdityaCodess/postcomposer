const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    required: true,
    enum: ['twitter', 'linkedin', 'facebook', 'instagram'],
  },
  content: {
    type: String,
  },
  media: {
    type: String,
  },
  status: {
    type: String,
    default: 'published',
    enum: ['draft', 'published', 'failed']
  }
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);