const mongoose = require('mongoose');

const userPostSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    categoryPosts: {
        type: Map,
        of: {
            totalPosts: { type: Number, default: 0 },
            freePostsUsed: { type: Number, default: 0 },
            paidPosts: { type: Number, default: 0 },
            lastPostedAt: { type: Date }
        },
        default: {}
    },
    totalFreePostsUsed: {
        type: Number,
        default: 0
    },
    totalPaidPosts: {
        type: Number,
        default: 0
    },
    totalAmountPaid: {
        type: Number,
        default: 0
    },
    subscription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subscription',
        default: null
    },
    subscriptionExpiry: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Method to check if user can post for free in a category
userPostSchema.methods.canPostForFree = function(categoryName) {
    const categoryConfig = require('../configs/categoryForms').CATEGORY_FORMS;
    const categoryKey = Object.keys(categoryConfig).find(key => 
        categoryConfig[key].name.toLowerCase() === categoryName.toLowerCase()
    );
    
    if (!categoryKey) return false;
    
    const config = categoryConfig[categoryKey];
    const categoryData = this.categoryPosts.get(categoryKey) || { freePostsUsed: 0 };
    
    return categoryData.freePostsUsed < config.freePosts;
};

// Method to get post cost for category
userPostSchema.methods.getPostCost = function(categoryName) {
    const categoryConfig = require('../configs/categoryForms').CATEGORY_FORMS;
    const categoryKey = Object.keys(categoryConfig).find(key => 
        categoryConfig[key].name.toLowerCase() === categoryName.toLowerCase()
    );
    
    if (!categoryKey) return 0;
    
    const config = categoryConfig[categoryKey];
    
    // Check if user can post for free
    if (this.canPostForFree(categoryName)) {
        return 0;
    }
    
    return config.price;
};

// Method to record a post
userPostSchema.methods.recordPost = function(categoryName, isPaid = false) {
    const categoryConfig = require('../configs/categoryForms').CATEGORY_FORMS;
    const categoryKey = Object.keys(categoryConfig).find(key => 
        categoryConfig[key].name.toLowerCase() === categoryName.toLowerCase()
    );
    
    if (!categoryKey) return;
    
    const config = categoryConfig[categoryKey];
    let categoryData = this.categoryPosts.get(categoryKey) || {
        totalPosts: 0,
        freePostsUsed: 0,
        paidPosts: 0,
        lastPostedAt: null
    };
    
    categoryData.totalPosts += 1;
    categoryData.lastPostedAt = new Date();
    
    if (isPaid) {
        categoryData.paidPosts += 1;
        this.totalPaidPosts += 1;
        this.totalAmountPaid += config.price;
    } else {
        categoryData.freePostsUsed += 1;
        this.totalFreePostsUsed += 1;
    }
    
    this.categoryPosts.set(categoryKey, categoryData);
    return this.save();
};

// Static method to find or create user post record
userPostSchema.statics.findOrCreate = async function(userId) {
    let userPost = await this.findOne({ user: userId });
    if (!userPost) {
        userPost = new this({ user: userId });
        await userPost.save();
    }
    return userPost;
};

module.exports = mongoose.model('UserPost', userPostSchema);
