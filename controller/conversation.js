const Conversation = require("../model/conversation");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const express = require("express");
const { isSeller, isAuthenticated } = require("../middleware/auth");
const router = express.Router();

// create a new conversation
router.post(
  "/create-new-conversation",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { groupTitle, userId, sellerId, productId } = req.body;

      // Build query to check for existing conversation
      const query = {
        members: { $all: [userId, sellerId] }
      };
      
      // If productId is provided, also check for it to ensure product-specific conversations
      if (productId) {
        query.productId = productId;
      }

      // Check if a conversation already exists between these two users (and for this product if specified)
      const isConversationExist = await Conversation.findOne(query);

      if (isConversationExist) {
        // Return existing conversation
        const conversation = isConversationExist;
        res.status(201).json({
          success: true,
          conversation,
        });
      } else {
        // Create new conversation
        const conversation = await Conversation.create({
          members: [userId, sellerId],
          groupTitle: groupTitle,
          productId: productId || null,
        });

        res.status(201).json({
          success: true,
          conversation,
        });
      }
    } catch (error) {
      return next(new ErrorHandler(error.response.message), 500);
    }
  })
);

// get seller conversations
router.get(
  "/get-all-conversation-seller/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const conversations = await Conversation.find({
        members: {
          $in: [req.params.id],
        },
      }).sort({ updatedAt: -1, createdAt: -1 });

      res.status(201).json({
        success: true,
        conversations,
      });
    } catch (error) {
      return next(new ErrorHandler(error), 500);
    }
  })
);

// get user conversations
router.get(
  "/get-all-conversation-user/:id",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const conversations = await Conversation.find({
        members: {
          $in: [req.params.id],
        },
      }).sort({ updatedAt: -1, createdAt: -1 });

      // Add other user information (seller) for each conversation
      const Shop = require("../model/shop");
      const User = require("../model/user");
      
      const conversationsWithOtherUser = await Promise.all(
        conversations.map(async (conv) => {
          const convObj = conv.toObject();
          
          // Find the other member (not the current user)
          const otherMemberId = conv.members.find(
            (member) => member.toString() !== req.params.id
          );
          
          if (otherMemberId) {
            try {
              // Try to find in Shop collection first (seller)
              let otherUser = await Shop.findById(otherMemberId).lean();
              
              if (otherUser) {
                convObj.otherUser = {
                  _id: otherUser._id,
                  name: otherUser.name,
                  email: otherUser.email,
                  avatar: otherUser.avatar,
                  phoneNumber: otherUser.phoneNumber,
                  address: otherUser.address,
                };
              } else {
                // If not found in Shop, try User collection
                otherUser = await User.findById(otherMemberId).lean();
                if (otherUser) {
                  convObj.otherUser = {
                    _id: otherUser._id,
                    name: otherUser.name,
                    email: otherUser.email,
                    avatar: otherUser.avatar,
                    phoneNumber: otherUser.phoneNumber,
                  };
                }
              }
            } catch (err) {
              console.error("Error fetching other user:", err);
            }
          }
          
          return convObj;
        })
      );

      // Group conversations to show only the most recent for each seller
      // This prevents showing multiple conversations with the same seller for different products
      const groupedConversations = new Map();
      conversationsWithOtherUser.forEach((conv) => {
        const otherUserId = conv.otherUser?._id?.toString();
        
        if (otherUserId) {
          // Group by seller only (ignore productId to show just one conversation per seller)
          const key = otherUserId;
          const existing = groupedConversations.get(key);
          
          if (!existing || new Date(conv.updatedAt) > new Date(existing.updatedAt)) {
            groupedConversations.set(key, conv);
          }
        } else {
          // If no otherUser, add as-is with unique key
          groupedConversations.set(conv._id.toString(), conv);
        }
      });

      const finalConversations = Array.from(groupedConversations.values());

      res.status(201).json({
        success: true,
        conversations: finalConversations,
      });
    } catch (error) {
      return next(new ErrorHandler(error), 500);
    }
  })
);

// update the last message
router.put(
  "/update-last-message/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { lastMessage, lastMessageId } = req.body;

      const conversation = await Conversation.findByIdAndUpdate(req.params.id, {
        lastMessage,
        lastMessageId,
      });

      res.status(201).json({
        success: true,
        conversation,
      });
    } catch (error) {
      return next(new ErrorHandler(error), 500);
    }
  })
);

module.exports = router;
