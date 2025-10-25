const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const {
    addToCart,
    updateCartItem,
    removeFromCart,
    getCart,
    removeMultipleFromCart
} = require('../controller/cartController');

router.post('/add', isAuthenticated, addToCart);
router.put('/update/:cartItemId', isAuthenticated, updateCartItem);
router.delete('/remove/:cartItemId', isAuthenticated, removeFromCart);
router.delete('/remove-multiple', isAuthenticated, removeMultipleFromCart);
router.get('/all', isAuthenticated, getCart);

module.exports = router; 