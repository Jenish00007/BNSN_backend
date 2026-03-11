const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    groupTitle: {
      type: String,
    },
    members: {
      type: Array,
    },
    productId: {
      type: String,
      default: null,
    },
    lastMessage: {
      type: String,
    },
    lastMessageId: {
      type: String,
    },
    // Role identification fields
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
  },
  { timestamps: true }
);

// Pre-save hook to prevent self-conversations and remove duplicates
conversationSchema.pre('save', function(next) {
  if (this.members && this.members.length === 2) {
    // Remove duplicate members if they're the same
    const uniqueMembers = [...new Set(this.members.map(m => m.toString()))];
    
    if (uniqueMembers.length === 1) {
      // Self-conversation detected - prevent saving
      return next(new Error('Cannot create conversation with yourself'));
    }
    
    this.members = uniqueMembers;
  }
  next();
});

module.exports = mongoose.model("Conversation", conversationSchema);
