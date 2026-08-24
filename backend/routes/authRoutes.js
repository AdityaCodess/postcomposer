const express = require('express');
const router = express.Router();

// 1. Import ALL controllers here, including the new forgot/reset ones
const { 
  login, 
  googleLogin, 
  sendOtp, 
  signup, 
  forgotPassword, 
  resetPassword 
} = require('../controllers/authController');

// 2. Existing Routes
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/send-otp', sendOtp);
router.post('/signup', signup);

// 3. New Password Reset Routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;