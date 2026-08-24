const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { sendEmailOTP } = require('../utils/mailer');
const bcrypt = require('bcryptjs');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @desc    Standard Email/Password Login
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: { token, user: { id: user._id, username: user.username, email: user.email } }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// @desc    Google OAuth Login/Signup
// @route   POST /api/auth/google
const googleLogin = async (req, res) => {
  try {
    const { tokenId } = req.body;
    
    const ticket = await googleClient.verifyIdToken({
      idToken: tokenId,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const { email, name, sub: googleId } = ticket.getPayload();

    let user = await User.findOne({ email });

    if (!user) {
      const baseUsername = name ? name.replace(/\s+/g, '').toLowerCase() : email.split('@')[0];
      const randomString = Math.floor(1000 + Math.random() * 9000).toString();
      
      // FIX: Generate a cryptographically secure 64-character hex password
      const secureRandomPassword = crypto.randomBytes(32).toString('hex');
      
      user = await User.create({ 
        email, 
        googleId,
        username: `${baseUsername}${randomString}`,
        password: secureRandomPassword 
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Google login successful',
      data: { token, user: { id: user._id, username: user.username, email: user.email } }
    });
    
  } catch (error) {
    console.error('Google auth error:', error);
    return res.status(500).json({ success: false, message: 'Google authentication failed' });
  }
};

// @desc    Send OTP for registration
// @route   POST /api/auth/send-otp
const sendOtp = async (req, res) => {
  try {
    const { email, username } = req.body;

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ success: false, message: 'Username is already taken' });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.deleteMany({ email });
    await Otp.create({ email, otp: otpCode });
    await sendEmailOTP(email, otpCode);

    return res.status(200).json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('OTP Error:', error);
    return res.status(500).json({ success: false, message: 'Error sending OTP' });
  }
};

// @desc    Verify OTP and Register
// @route   POST /api/auth/signup
const signup = async (req, res) => {
  try {
    const { username, email, password, otp } = req.body;

    const otpRecord = await Otp.findOne({ email });
    
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'OTP expired or not found' });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({ 
      username, 
      email, 
      password: hashedPassword // Save the encrypted string!
    });
    
    await Otp.deleteMany({ email });
    
    const token = generateToken(newUser._id);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { token, user: { id: newUser._id, username: newUser.username, email: newUser.email } }
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ success: false, message: 'Error creating account' });
  }
};

// @desc    Send OTP for Password Reset
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Reuse the exact same Otp model and mailer utility you already built
    await Otp.deleteMany({ email });
    await Otp.create({ email, otp: otpCode });
    await sendEmailOTP(email, otpCode);

    return res.status(200).json({ success: true, message: 'Password reset OTP sent to email' });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    return res.status(500).json({ success: false, message: 'Error sending reset OTP' });
  }
};

// @desc    Verify OTP and Reset Password
// @route   POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const otpRecord = await Otp.findOne({ email });
    
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'OTP expired or not found' });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    // Clean up OTP
    await Otp.deleteMany({ email });

    return res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    return res.status(500).json({ success: false, message: 'Error resetting password' });
  }
};

module.exports = { login, googleLogin, sendOtp, signup, forgotPassword, resetPassword };