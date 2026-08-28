const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 1. Generate an Order ID for the frontend
exports.createOrder = async (req, res) => {
  try {
    const { plan, isAnnual } = req.body;
    
    // Define your pricing logic
    let amount = 0;
    if (plan === 'creator') amount = isAnnual ? 7788 : 749;
    if (plan === 'pro') amount = isAnnual ? 35988 : 3499;

    if (amount === 0) return res.status(400).json({ success: false, message: 'Invalid plan selected' });

    const options = {
      amount: amount * 100, // Razorpay expects amount in paise (multiply by 100)
      currency: "INR",
      receipt: `receipt_${req.user.id}_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    
    res.status(200).json({ success: true, data: order, key: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    console.error("Order Creation Error:", error);
    res.status(500).json({ success: false, message: 'Failed to create payment order' });
  }
};

// 2. Verify payment signature and upgrade user
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;

    // Securely verify the signature using your secret key
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Payment is legit! Upgrade the user quotas
    let aiCredits = 10;
    let linkedinLimit = 28;
    let actualPlanName = 'free';

    if (plan === 'creator') {
      aiCredits = 1000;
      linkedinLimit = 700;
      actualPlanName = 'creator';
    } else if (plan === 'pro') {
      aiCredits = 30000;
      linkedinLimit = 10000;
      actualPlanName = 'Agentic Pro';
    }

    await User.findByIdAndUpdate(req.user.id, {
      'subscription.plan': actualPlanName,
      'subscription.aiCreditsRemaining': aiCredits,
      'subscription.linkedinPostsThisMonth': 0 // Reset their usage for the new month
    });

    res.status(200).json({ success: true, message: 'Payment verified and account upgraded successfully!' });
  } catch (error) {
    console.error("Payment Verification Error:", error);
    res.status(500).json({ success: false, message: 'Failed to verify payment' });
  }
};