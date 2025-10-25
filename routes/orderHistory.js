const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const {
    getOrderHistory,
    getOrderDetails,
    getOrderStats
} = require('../controller/orderHistoryController');

// Get order history with filtering and pagination
router.get('/history', isAuthenticated, getOrderHistory);

// Get specific order details
router.get('/details/:orderId', isAuthenticated, getOrderDetails);

// Get order statistics
router.get('/stats', isAuthenticated, getOrderStats);

module.exports = router; 