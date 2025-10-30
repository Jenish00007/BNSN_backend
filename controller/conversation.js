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
      const { groupTitle, userId, sellerId } = req.body;

      // Check if a conversation already exists between these two users
      const isConversationExist = await Conversation.findOne({
        members: { $all: [userId, sellerId] }
      });

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

      res.status(201).json({
        success: true,
        conversations: conversationsWithOtherUser,
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
