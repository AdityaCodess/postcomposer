require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes'); 

const app = express();

// Standard Middleware
app.use(express.json({ limit: '10mb' })); // Increased limit to handle Base64 image uploads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected successfully!'))
  .catch(err => console.error('MongoDB connection error:', err));

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});