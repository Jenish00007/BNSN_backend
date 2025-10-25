const mongoose = require('mongoose');

const favoriteShopSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create a compound index to ensure a user can't favorite the same shop twice
favoriteShopSchema.index({ user: 1, shop: 1 }, { unique: true });

module.exports = mongoose.model('FavoriteShop', favoriteShopSchema); 