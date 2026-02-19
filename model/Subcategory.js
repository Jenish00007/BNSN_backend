const mongoose = require('mongoose');

const subcategorySchema = new mongoose.Schema({
    subcategory_id: {
        type: Number,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    image: {
        type: String,
        required: false
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
});

// Pre-save hook to auto-increment subcategory_id
subcategorySchema.pre('save', async function(next) {
    if (this.isNew) {
        try {
            // Find the highest subcategory_id and increment by 1
            const lastSubcategory = await this.constructor.findOne().sort('-subcategory_id').exec();
            this.subcategory_id = lastSubcategory ? lastSubcategory.subcategory_id + 1 : 1;
        } catch (error) {
            console.error('Error auto-incrementing subcategory_id:', error);
            this.subcategory_id = 1; // Fallback to 1 if there's an error
        }
    }
    next();
});

module.exports = mongoose.model('Subcategory', subcategorySchema); 