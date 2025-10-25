const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true
    },
    name: {
        type: String,
        required: [true, 'Module name is required'],
        unique: true,
        trim: true
    },
    image: {
        type: String,
        required: [true, 'Module image is required']
    },
    description: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Add pre-save middleware to handle ID generation
moduleSchema.pre('save', function(next) {
    if (!this._id) {
        this._id = new mongoose.Types.ObjectId();
    }
    next();
});

module.exports = mongoose.model('Module', moduleSchema); 