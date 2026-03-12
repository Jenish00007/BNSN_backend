const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../model/user');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_XXXXXXXXXXXXXXXX',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
});

// Process payment - create Razorpay payment link
router.post('/process', async (req, res) => {
  try {
    const { amount, email, name, contact, notes } = req.body;

    console.log('Payment process request received:', { 
      amount, 
      email, 
      name, 
      contact, 
      notes,
      headers: req.headers.authorization ? 'Auth header present' : 'No auth header'
    });

    // Validate required fields
    if (!amount || !email || !name) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: amount, email, name'
      });
    }

    // Check if user is authenticated
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      console.log('Payment error: No authentication token provided');
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login to continue.'
      });
    }

    try {
      // Create Razorpay payment link
      const paymentLink = await razorpay.paymentLink.create({
        amount: parseInt(amount), // Ensure amount is integer
        currency: 'INR',
        accept_partial: false,
        description: `BNSN Subscription - ${notes?.subscriptionType || 'Contact Credits'}`,
        customer: {
          name: name,
          email: email,
          contact: contact || ''
        },
        notify: {
          sms: true,
          email: true
        },
        reminder_enable: true,
        notes: {
          ...notes,
          timestamp: new Date().toISOString(),
          source: 'BNSN Mobile App'
        },
        callback_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success`,
        callback_method: 'get'
      });

      console.log('Payment link created successfully:', {
        id: paymentLink.id,
        short_url: paymentLink.short_url,
        amount: paymentLink.amount
      });

      res.json({
        success: true,
        paymentLink: paymentLink.short_url,
        paymentId: paymentLink.id
      });

    } catch (razorpayError) {
      console.error('Razorpay payment link creation failed:', razorpayError);
      res.status(500).json({
        success: false,
        message: razorpayError.error?.description || 'Failed to create payment link'
      });
    }

  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment link'
    });
  }
});

// Verify payment - handle Razorpay webhook/payment verification
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify signature
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Payment is verified, you can update order status here
    res.json({
      success: true,
      message: 'Payment verified successfully'
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Payment verification failed'
    });
  }
});

// Webhook handler for Razorpay events
router.post('/webhook', async (req, res) => {
  try {
    const webhook_secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];
    
    if (!signature) {
      return res.status(400).json({ success: false, message: 'No signature provided' });
    }

    // Verify webhook signature
    const body = JSON.stringify(req.body);
    const expected_signature = crypto
      .createHmac('sha256', webhook_secret)
      .update(body)
      .digest('hex');

    if (signature !== expected_signature) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const event = req.body.event;
    const paymentData = req.body.payload.payment.entity;

    console.log('Webhook event:', event);

    if (event === 'payment.captured') {
      // Payment successful - handle contact credits addition
      await handleSuccessfulPayment(paymentData);
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Webhook processing failed'
    });
  }
});

// Handle successful payment and add contact credits
async function handleSuccessfulPayment(paymentData) {
  try {
    const notes = paymentData.notes;
    const userId = notes?.userId;
    const credits = parseInt(notes?.credits) || 7;
    const duration = parseInt(notes?.duration) || 30;

    if (!userId) {
      console.error('No userId found in payment notes');
      return;
    }

    // Find user and update contact credits
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found:', userId);
      return;
    }

    // Add contact credits and set expiry
    const currentCredits = user.contactCredits || 0;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + duration);

    await User.findByIdAndUpdate(userId, {
      $set: {
        contactCredits: currentCredits + credits,
        subscriptionExpiry: expiryDate,
        lastPaymentDate: new Date()
      }
    });

    console.log(`Added ${credits} credits to user ${userId}, expires on ${expiryDate}`);

  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
}

module.exports = router;
