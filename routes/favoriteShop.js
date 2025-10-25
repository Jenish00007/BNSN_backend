const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const {
    addToFavoriteShops,
    removeFromFavoriteShops,
    getFavoriteShops,
    checkFavoriteShop
} = require('../controller/favoriteShopController');

// Add shop to favorites
router.post('/add', isAuthenticated, addToFavoriteShops);

// Remove shop from favorites
router.delete('/remove/:shopId', isAuthenticated, removeFromFavoriteShops);

// Get user's favorite shops
router.get('/all', isAuthenticated, getFavoriteShops);

// Check if shop is in favorites
router.get('/check/:shopId', isAuthenticated, checkFavoriteShop);

module.exports = router; 