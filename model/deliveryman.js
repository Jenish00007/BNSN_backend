const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const deliverymanSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter your name"],
    },
    email: {
        type: String,
        required: [true, "Please enter your email"],
        unique: true,
        validate: {
            validator: function (v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: "Please enter a valid email",
        },
    },
    password: {
        type: String,
        required: [true, "Please enter your password"],
        minLength: [6, "Password should be greater than 6 characters"],
        select: false,
    },
    phoneNumber: {
        type: String,
        required: [true, "Please enter your phone number"],
    },
    address: {
        type: String,
        required: [true, "Please enter your address"],
    },
    vehicleType: {
        type: String,
        required: [true, "Please enter your vehicle type"],
        enum: ["bike", "scooter", "bicycle"],
    },
    vehicleNumber: {
        type: String,
        required: [true, "Please enter your vehicle number"],
    },
    licenseNumber: {
        type: String,
        required: [true, "Please enter your license number"],
    },
    idProof: {
        type: String,
        required: [true, "Please upload your ID proof"],
    },
    isApproved: {
        type: Boolean,
        default: false,
    },
    isAvailable: {
        type: Boolean,
        default: true,
    },
    expoPushToken: {
        type: String,
        default: null,
    },
    currentLocation: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point",
        },
        coordinates: {
            type: [Number],
            default: [0, 0],
        },
    },
    rating: {
        type: Number,
        default: 0,
    },
    totalDeliveries: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Hash password before saving
deliverymanSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        next();
    }
    this.password = await bcrypt.hash(this.password, 10);
});

// Compare password method
deliverymanSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
deliverymanSchema.methods.getJwtToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY);
};

// Create index for geospatial queries
deliverymanSchema.index({ currentLocation: "2dsphere" });

module.exports = mongoose.model("DeliveryMan", deliverymanSchema); 