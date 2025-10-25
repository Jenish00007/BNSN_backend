const mongoose = require('mongoose');

const configurationSchema = new mongoose.Schema({
    appName: {
        type: String,
        required: true
    },
    appNameLowerLetter: {
        type: String,
        required: true,
        lowercase: true
    },
    appPackageId: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    owner: {
        type: String,
        required: true
    },
    appType: {
        type: String,
        enum: ['multivendor', 'singlevendor'],
        required: true,
        default: 'singlevendor'
    },
    versionCode: {
        type: Number,
        required: true,
        default: 1
    },
    projectId: {
        type: String,
        required: true
    },
    appIcon: {
        type: String,
        required: true
    },
    logo: {
        type: String,
        required: true
    },
    banner: {
        type: String,
        default: "https://qauds.s3.ap-south-1.amazonaws.com/misc/groceries-packages-delivery-covid19-quarantine-shopping-concept-handsome-smiling-courier-red-uniform-give-cheeky-wink-as-delivering-food-box-online-order-client-house-1749022161520-475913107.jpg"
    },
    homepageContent: {
        title: {
            type: String,
            default: "Fresh Groceries"
        },
        subtitle: {
            type: String,
            default: "Delivered to Your Door"
        },
        description: {
            type: String,
            default: "Discover our wide selection of fresh fruits, vegetables, dairy products, and pantry essentials. Shop from the comfort of your home and get your groceries delivered right to your doorstep."
        }
    },
    appColors: {
        primary: {
            type: String
        },
        secondary: {
            type: String
        },
        accent: {
            type: String
        }
    },
    socialMediaLinks: {
        facebook: String,
        twitter: String,
        instagram: String,
        linkedin: String
    },
    contactInfo: {
        email: String,
        phone: String,
        address: String
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Configuration', configurationSchema); 