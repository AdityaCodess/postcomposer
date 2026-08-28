const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment } = require('../controllers/billingController');
const { protect } = require('../middleware/authMiddleware'); 

router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);

module.exports = router;