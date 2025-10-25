const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const {
    addToFavorites,
    removeFromFavorites,
    getFavorites
} = require('../controller/favoriteController');

router.post('/add', isAuthenticated, addToFavorites);
router.delete('/remove/:productId', isAuthenticated, removeFromFavorites);
router.get('/all', isAuthenticated, getFavorites);

module.exports = router; 