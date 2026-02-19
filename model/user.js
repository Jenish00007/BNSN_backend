const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  userId: {
    type: Number,
    unique: true,
    sparse: true, // Allow null values but ensure uniqueness when present
    index: true
  },
  name: {
    type: String,
    required: [true, "Please enter your name!"],
  },
  email: {
    type: String,
    required: [true, "Please enter your email!"],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, "Please enter your password"],
    minLength: [4, "Password should be greater than 4 characters"],
    select: false,
  },
  phoneNumber: {
    type: String,
    required: [true, "Please enter your phone number!"],
    unique: true,
    validate: {
      validator: function(v) {
        return /^\d{10}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  addresses: [
    {
      country: {
        type: String,
      },
      city: {
        type: String,
      },
      address1: {
        type: String,
      },
      address2: {
        type: String,
      },
      zipCode: {
        type: Number,
      },
      addressType: {
        type: String,
      },
    },
  ],
  role: {
    type: String,
    default: "user",
  },
  avatar: {
    type: String,
    required: true,
  },
  lastKnownLocation: {
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    address: {
      type: String,
      default: null,
    },
    updatedAt: {
      type: Date,
    },
  },
  pushToken: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  otp: {
    code: String,
    expiresAt: Date
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  hidePhoneNumber: {
    type: Boolean,
    default: false
  },
  // Contact views and subscription fields
  contactViews: {
    type: Number,
    default: 0
  },
  viewedContacts: [{
    type: String, // Contact IDs that have been viewed
    default: []
  }],
  hasUnlimitedContacts: {
    type: Boolean,
    default: false
  },
  subscriptionExpiry: {
    type: Date,
    default: null
  },
  contactCredits: {
    type: Number,
    default: 7 // Free credits
  }
});

// Auto-increment userId
userSchema.pre("save", async function (next) {
  if (this.isNew && !this.userId) {
    try {
      // Get the highest userId from existing users
      const lastUser = await this.constructor.findOne({}, {}, { sort: { userId: -1 } });
      const nextUserId = lastUser && lastUser.userId ? lastUser.userId + 1 : 1;
      this.userId = nextUserId;
    } catch (error) {
      // If there's an error, default to 1
      this.userId = 1;
    }
  }
  next();
});

//  Hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  this.password = await bcrypt.hash(this.password, 10);
});

// jwt token
userSchema.methods.getJwtToken = function () {
  return jwt.sign(
    { 
      id: this._id,
      role: this.role,
      isPhoneVerified: this.isPhoneVerified
    }, 
    process.env.JWT_SECRET_KEY
  );
};

// compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate OTP
userSchema.methods.generateOTP = function() {
  // Generate 6 digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Set OTP and expiry (10 minutes)
  this.otp = {
    code: otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
  };

  return otp;
};

// Verify OTP
userSchema.methods.verifyOTP = function(enteredOTP) {
  if (!this.otp || !this.otp.code || !this.otp.expiresAt) {
    return false;
  }

  // Check if OTP is expired
  const now = new Date();
  if (now > this.otp.expiresAt) {
    // Clear expired OTP
    this.otp = undefined;
    return false;
  }

  // Check if OTP matches
  const isValid = this.otp.code === enteredOTP;
  
  if (isValid) {
    this.isPhoneVerified = true;
    this.otp = undefined; // Clear OTP after successful verification
  }

  return isValid;
};

module.exports = mongoose.model("User", userSchema);
