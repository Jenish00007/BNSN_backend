const mongoose = require("mongoose");

const unitSchema = new mongoose.Schema({
  id: {
    type: String,
    required: [true, "Unit ID is required!"],
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, "Unit name is required!"],
    trim: true
  },
  description: {
    type: String,
    required: [true, "Unit description is required!"],
    trim: true
  },
  category: {
    type: String,
    enum: ['weight', 'volume', 'length', 'area', 'time', 'count', 'other'],
    default: 'other'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

// Update the updatedAt field before saving
unitSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Unit", unitSchema); 