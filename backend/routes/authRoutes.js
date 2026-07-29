const express = require('express');
const { login, googleLogin, sendOtp, signup } = require('../controllers/authController');

const router = express.Router();

router.post('/login', login);
router.post('/google', googleLogin);
router.post('/send-otp', sendOtp);
router.post('/signup', signup);

module.exports = router;