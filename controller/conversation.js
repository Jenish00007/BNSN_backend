const Conversation = require("../model/conversation");
const Product = require("../model/product");
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

      if (productId) {
        const product = await Product.findById(productId);
        if (!product) {
          return next(new ErrorHandler("Product not found", 404));
        }

        if (product.status && product.status !== "active") {
          return next(
            new ErrorHandler(
              "This listing is no longer available for new conversations",
              400
            )
          );
        }
      }

      // Validate that userId and sellerId are different
      if (userId === sellerId) {
        return next(new ErrorHandler("Cannot create conversation with yourself", 400));
      }

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
        // Create new conversation with proper role identification
        const conversation = await Conversation.create({
          members: [userId, sellerId],
          groupTitle: groupTitle,
          productId: productId || null,
          // Add metadata for role identification
          buyerId: userId,  // The user initiating the conversation is typically the buyer
          sellerId: sellerId, // The shop owner is the seller
        });

        res.status(201).json({
          success: true,
          conversation,
        });
      }
    } catch (error) {
      return next(new ErrorHandler(error.message || error.response?.message, 500));
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
          
          // Determine current user's role in this conversation
          const isBuyer = conv.buyerId && conv.buyerId.toString() === req.params.id;
          const isSeller = conv.sellerId && conv.sellerId.toString() === req.params.id;
          
          // Fallback: if buyerId/sellerId are not populated, determine role by checking other member
          let currentUserRole = isBuyer ? 'buyer' : (isSeller ? 'seller' : null);
          let otherUserRole = null;
          
          if (!currentUserRole && conv.members && conv.members.length === 2) {
            const otherMemberId = conv.members.find(
              (member) => member.toString() !== req.params.id
            );
            
            if (otherMemberId) {
              try {
                // Check if other member is a shop (seller) or user (buyer)
                const Shop = require("../model/shop");
                const User = require("../model/user");
                
                const otherUserShop = await Shop.findById(otherMemberId).lean();
                if (otherUserShop) {
                  // Other person is a shop, so current user is buyer
                  currentUserRole = 'buyer';
                  otherUserRole = 'seller';
                } else {
                  const otherUserUser = await User.findById(otherMemberId).lean();
                  if (otherUserUser) {
                    // Other person is a regular user, so current user could be seller or buyer
                    // Check if current user is a shop
                    const currentUserShop = await Shop.findById(req.params.id).lean();
                    if (currentUserShop) {
                      currentUserRole = 'seller';
                      otherUserRole = 'buyer';
                    } else {
                      // Both are regular users - need to determine based on product ownership
                      // For now, assume the person who initiated is buyer, but this needs product context
                      // Let's check if the product belongs to the other user
                      if (conv.productId) {
                        const Product = require("../model/product");
                        const product = await Product.findById(conv.productId);
                        if (product && product.userId && product.userId.toString() === otherMemberId.toString()) {
                          // Product belongs to other user, so they are seller
                          currentUserRole = 'buyer';
                          otherUserRole = 'seller';
                        } else {
                          // Default assumption - current user is buyer
                          currentUserRole = 'buyer';
                          otherUserRole = 'seller';
                        }
                      } else {
                        // No product info, default assumption
                        currentUserRole = 'buyer';
                        otherUserRole = 'seller';
                      }
                    }
                  }
                }
              } catch (err) {
                console.error("Error determining fallback role:", err);
              }
            }
          }
          
          convObj.currentUserRole = currentUserRole;
          convObj.otherUserRole = otherUserRole;
          
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
                  phoneNumber: otherUser.phoneNumber,
                  role: otherUserRole
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
                    role: 'buyer'
                  };
                  convObj.otherUserRole = 'buyer';
                }
              }
            } catch (err) {
              console.error("Error fetching other user:", err);
            }
          }
          
          if (conv.productId) {
            try {
              const product = await Product.findById(conv.productId).select(
                "name status expiresAt soldAt inactiveAt userId"
              );
              if (product) {
                convObj.product = {
                  _id: product._id,
                  name: product.name,
                  status: product.status,
                  expiresAt: product.expiresAt,
                  soldAt: product.soldAt,
                  inactiveAt: product.inactiveAt,
                  userId: product.userId
                };
                convObj.productStatus = product.status;
                if (product.status && product.status !== "active") {
                  convObj.isChatDisabled = true;
                  convObj.chatDisabledReason =
                    product.status === "sold"
                      ? "Product marked as sold"
                      : "Listing is inactive";
                } else {
                  convObj.isChatDisabled = false;
                }
              }
            } catch (err) {
              console.error("Error fetching product for conversation:", err);
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
      return next(new ErrorHandler(error.message, 500));
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
