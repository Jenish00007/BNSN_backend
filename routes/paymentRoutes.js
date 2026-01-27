const express = require('express');
const router = express.Router();
const { isAuthenticated } = require("../middleware/auth");
const paymentController = require("../controller/paymentController");

// Create payment intent for posting
router.post('/create-intent', isAuthenticated, paymentController.createPaymentIntent);

// Verify payment completion
router.post('/verify', isAuthenticated, paymentController.verifyPayment);

// Get user's post history and payment status
router.get('/history', isAuthenticated, paymentController.getUserPostHistory);

// Get post cost for a specific category
router.get('/cost/:categoryName', isAuthenticated, paymentController.getPostCost);

module.exports = router;
