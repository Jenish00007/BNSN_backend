const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    productType: {
        type: String,
        required: true,
        enum: ['Product', 'Event'] // Only allow these two types
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'productType' // Dynamically references Product or Event
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    selectedVariation: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Create a compound index to ensure a user can't have duplicate products in cart
cartSchema.index({ user: 1, product: 1, selectedVariation: 1 }, { unique: true });

// Update the updatedAt timestamp before saving
cartSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Cart', cartSchema); 