const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['razorpay', 'phonepe', 'upi', 'card', 'netbanking'],
        required: true
    },
    transactionId: {
        type: String,
        unique: true,
        sparse: true
    },
    gatewayResponse: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Method to mark payment as completed
paymentSchema.methods.markCompleted = function(transactionId, gatewayResponse = {}) {
    this.status = 'completed';
    this.transactionId = transactionId;
    this.gatewayResponse = gatewayResponse;
    this.completedAt = new Date();
    return this.save();
};

// Method to mark payment as failed
paymentSchema.methods.markFailed = function(gatewayResponse = {}) {
    this.status = 'failed';
    this.gatewayResponse = gatewayResponse;
    return this.save();
};

module.exports = mongoose.model('Payment', paymentSchema);
