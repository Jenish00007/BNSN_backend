const mongoose = require("mongoose");

const withdrawSchema = new mongoose.Schema({
  seller: {
    type: Object,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    default: "Processing",
  },
  bankName: {
    type: String,
    required: true,
  },
  bankAccountNumber: {
    type: String,
    required: true,
  },
  bankIfscCode: {
    type: String,
    required: true,
  },
  transactionId: {
    type: String,
  },
  paymentMethod: {
    type: String,
    default: "Bank Transfer",
  },
  processingFee: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  updatedAt: {
    type: Date,
  },
});

module.exports = mongoose.model("Withdraw", withdrawSchema);
