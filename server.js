const express = require("express");
const ErrorHandler = require("./middleware/error");
const connectDatabase = require("./db/Database");
const app = express();
const http = require("http").createServer(app);
const { Server } = require("socket.io");

const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const Messages = require("./model/messages");
const Conversation = require("./model/conversation");
const Shop = require("./model/shop");
const User = require("./model/user");
const Product = require("./model/product");
const { sendFCMNotification } = require("./utils/fcmService");
const { getChatBlockInfo } = require("./utils/chatGuards");

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const PRODUCT_EXPIRY_CHECK_INTERVAL = 12 * 60 * 60 * 1000; // every 12 hours

// config
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "config/.env",
  });
}

// connect db
connectDatabase();

// create server
const server = http.listen(process.env.PORT, () => {
  console.log(`Server is running on http://localhost:${process.env.PORT}`);
})

// initialize socket.io
const io = new Server(server, {
  cors: {
    origin: true, // Allow all origins for mobile apps
    credentials: true,
    methods: ["GET", "POST"],
  },
  allowEIO3: true, // Allow Socket.io v3 clients
});

// middlewares
app.use(express.json());
app.use(cookieParser());
// Enable CORS for all routes

app.use(
  cors({
    origin: true, // Allow all origins for mobile apps
    credentials: true,
  })
);

// Remove local uploads static route since we're using S3
// app.use("/", express.static("uploads"));

app.get("/test", (req, res) => {
  res.send("Hello World!");
});

app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

// why bodyparser?
// bodyparser is used to parse the data from the body of the request to the server (POST, PUT, DELETE, etc.)

// config
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "config/.env",
  });
}

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// routes
const user = require("./controller/user");
const shop = require("./controller/shop");
const product = require("./controller/product");
const event = require("./controller/event");
const coupon = require("./controller/coupounCode");
const payment = require("./controller/payment");
const order = require("./controller/order");
const message = require("./controller/message");
const conversation = require("./controller/conversation");
const withdraw = require("./controller/withdraw");
const deliveryman = require("./controller/deliveryman");
const notification = require("./controller/notification");

// New routes
const moduleRoutes = require("./routes/moduleRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const subcategoryRoutes = require("./routes/subcategoryRoutes");
const userProductRoutes = require("./routes/userProduct");
const searchRoutes = require("./routes/search");
const shopRoutes = require("./routes/shopRoutes");
const shopBannerRoutes = require("./routes/shopBannerRoutes");
const adminBannerRoutes = require("./routes/adminBannerRoutes");
const favoriteRoutes = require("./routes/favorite");
const cartRoutes = require("./routes/cart");
const itemRoutes = require("./routes/itemRoutes");
const orderHistoryRoutes = require("./routes/orderHistory");
const favoriteShopRoutes = require("./routes/favoriteShop");
const distanceRoutes = require("./routes/distance");
const configurationRoutes = require("./routes/configurationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const deliverymanRoutes = require("./routes/deliveryman");
const unitRoutes = require("./routes/unitRoutes");
const fcmRoutes = require("./routes/fcmRoutes");
const userPostRoutes = require("./routes/userPostRoutes");
const contactViewsRoutes = require("./routes/contactViews");

// end points
app.use("/v2/withdraw", withdraw);
app.use("/v2/user", user);
app.use("/v2/conversation", conversation);
app.use("/v2/message", message);
app.use("/v2/order", order);
app.use("/v2/shop", shop);
app.use("/v2/product", product);
app.use("/v2/event", event);
app.use("/v2/coupon", coupon);
app.use("/v2/payment", payment);
app.use("/v2/notification", notification);

// New endpoints
app.use("/v2/modules", moduleRoutes);
app.use("/v2/categories", categoryRoutes);
app.use("/v2/subcategories", subcategoryRoutes);
app.use("/v2/user-products", userProductRoutes);
app.use("/v2/search", searchRoutes);
app.use("/v2/shops", shopRoutes);
app.use("/v2/shop-banners", shopBannerRoutes);
app.use("/v2/items", itemRoutes);
app.use("/v2/admin-banner", adminBannerRoutes);
app.use("/v2/favorites", favoriteRoutes);
app.use("/v2/cart", cartRoutes);
app.use("/v2/orders", orderHistoryRoutes);
app.use("/v2/favorite-shops", favoriteShopRoutes);
app.use("/v2/config", distanceRoutes);
app.use("/v2/settings", configurationRoutes);
app.use("/v2/admin", adminRoutes);
app.use("/v2/deliveryman", deliverymanRoutes);
app.use("/v2/units", unitRoutes);
app.use("/v2/fcm", fcmRoutes);
app.use("/v2/user-post", userPostRoutes);
app.use("/v2/contact-views", contactViewsRoutes);

const markExpiredProducts = async () => {
  try {
    const now = new Date();
    const expiryThreshold = new Date(now.getTime() - THIRTY_DAYS_MS);

    const result = await Product.updateMany(
      {
        status: "active",
        $or: [
          { expiresAt: { $lte: now } },
          { expiresAt: null, createdAt: { $lte: expiryThreshold } },
          { expiresAt: { $exists: false }, createdAt: { $lte: expiryThreshold } },
        ],
      },
      {
        status: "inactive",
        inactiveAt: now,
        inactiveReason: "Automatically marked inactive after 30 days",
      }
    );

    if (result.modifiedCount) {
      console.log(
        `[Product Lifecycle] Marked ${result.modifiedCount} product(s) as inactive due to expiry`
      );
    }
  } catch (error) {
    console.error("[Product Lifecycle] Failed to mark expired products:", error);
  }
};

// Run once on boot and then on interval
markExpiredProducts();
setInterval(markExpiredProducts, PRODUCT_EXPIRY_CHECK_INTERVAL);

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join chat room
  socket.on("join-chat-room", async (data) => {
    const { userId, conversationId } = data;
    const roomName = `chat-${conversationId}`;
    socket.join(roomName);
    console.log(`User ${userId} joined room: ${roomName}`);
  });

  // Leave chat room
  socket.on("leave-chat-room", async (data) => {
    const { userId, conversationId } = data;
    const roomName = `chat-${conversationId}`;
    socket.leave(roomName);
    console.log(`User ${userId} left room: ${roomName}`);
  });

  // Send message
  socket.on("send-message", async (data) => {
    try {
      console.log("=".repeat(80));
      console.log("🔵 [SEND-MESSAGE] Event received");
      console.log("=".repeat(80));
      
      const { conversationId, sender, text } = data;
      console.log(`[SEND-MESSAGE] Data:`, { conversationId, sender, text: text.substring(0, 50) });

      const chatGate = await getChatBlockInfo(conversationId);
      if (chatGate.blocked) {
        console.log(
          `[SEND-MESSAGE] Conversation ${conversationId} is blocked: ${chatGate.reason}`
        );
        socket.emit("chat-disabled", {
          conversationId,
          reason: chatGate.reason,
          productStatus: chatGate.productStatus || null,
        });
        return;
      }

      // Save message to database
      console.log(`[SEND-MESSAGE] Saving message to database...`);
      const message = new Messages({
        conversationId: conversationId,
        text: text,
        sender: sender,
      });

      await message.save();
      console.log(`[SEND-MESSAGE] ✅ Message saved: ${message._id}`);

      // Update conversation last message
      console.log(`[SEND-MESSAGE] Updating conversation last message...`);
      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: text,
        lastMessageId: message._id.toString(),
      });

      // Emit message to all users in the room
      console.log(`[SEND-MESSAGE] Emitting receive-message event...`);
      const roomName = `chat-${conversationId}`;
      io.to(roomName).emit("receive-message", {
        _id: message._id,
        conversationId: message.conversationId,
        text: message.text,
        sender: message.sender,
        createdAt: message.createdAt,
        read: false,
      });

      console.log("📬 Message sent:", message._id);

      // Send push notification to the other user
      console.log(`[NOTIFICATION] Starting notification process...`);
      try {
        console.log(`[NOTIFICATION] Fetching conversation: ${conversationId}`);
        const conversation = await Conversation.findById(conversationId);
        console.log(`[NOTIFICATION] Conversation found:`, conversation ? 'Yes' : 'No');
        if (conversation && conversation.members) {
          console.log(`[NOTIFICATION] Conversation has members: ${conversation.members.length}`);
          console.log(
            `[NOTIFICATION] Conversation members:`,
            conversation.members
          );
          console.log(`[NOTIFICATION] Sender:`, sender);

          // Find the other member (not the sender)
          const otherMemberId = conversation.members.find(
            (member) => member.toString() !== sender.toString()
          );

          console.log(`[NOTIFICATION] Other member ID:`, otherMemberId);

          if (!otherMemberId) {
            console.log(`[NOTIFICATION] ⚠️ No other member found in conversation`);
          } else if (otherMemberId.toString() === sender.toString()) {
            console.log(`[NOTIFICATION] ⚠️ Other member is same as sender (self-conversation?)`);
          }

          if (otherMemberId && otherMemberId.toString() !== sender.toString()) {
            // Get sender's name for notification
            console.log(`[NOTIFICATION] Looking up sender: ${sender}`);
            let senderName = "Someone";
            const senderUser = await User.findById(sender).lean();
            const senderShop = await Shop.findById(sender).lean();

            if (senderUser) {
              senderName = senderUser.name;
              console.log(`[NOTIFICATION] Sender is User: ${senderName}`);
            } else if (senderShop) {
              senderName = senderShop.name;
              console.log(`[NOTIFICATION] Sender is Shop: ${senderName}`);
            } else {
              console.log(`[NOTIFICATION] ⚠️ Sender not found as User or Shop`);
            }

            // Try to find other member as Shop first, then User
            let receiverPushToken = null;
            let receiverType = null;

            const otherShop = await Shop.findById(otherMemberId).lean();
            const otherUser = await User.findById(otherMemberId).lean();

            console.log(
              `[NOTIFICATION] Looking up receiver - Shop: ${
                otherShop ? "Found" : "Not found"
              }, User: ${otherUser ? "Found" : "Not found"}`
            );

            if (otherShop) {
              // Check for both pushToken and expoPushToken (backward compatibility)
              receiverPushToken =
                otherShop.pushToken || otherShop.expoPushToken;
              if (receiverPushToken) {
                receiverType = "Shop";
                const tokenType = otherShop.pushToken
                  ? "pushToken"
                  : "expoPushToken";
                console.log(
                  `[NOTIFICATION] ✅ Found Shop ${tokenType} for ${otherMemberId} (${
                    otherShop.name
                  }): ${receiverPushToken.substring(0, 20)}...`
                );
              }
            }

            if (!receiverPushToken && otherUser) {
              receiverPushToken = otherUser.pushToken;
              if (receiverPushToken) {
                receiverType = "User";
                console.log(
                  `[NOTIFICATION] ✅ Found User push token for ${otherMemberId} (${
                    otherUser.name
                  }): ${receiverPushToken.substring(0, 20)}...`
                );
              }
            }

            if (!receiverPushToken) {
              if (
                otherShop &&
                !otherShop.pushToken &&
                !otherShop.expoPushToken
              ) {
                console.log(
                  `[NOTIFICATION] ⚠️ Shop ${otherMemberId} (${otherShop.name}) found but has no pushToken or expoPushToken`
                );
              } else if (otherUser && !otherUser.pushToken) {
                console.log(
                  `[NOTIFICATION] ⚠️ User ${otherMemberId} (${otherUser.name}) found but has no pushToken`
                );
              } else {
                console.log(
                  `[NOTIFICATION] ❌ No Shop or User found for ${otherMemberId}`
                );
              }
            }

            // Always send notification for every message (optional: can add online check later)
            if (receiverPushToken) {
              const notificationTitle = `New message from ${senderName}`;
              const notificationBody =
                text.length > 50 ? text.substring(0, 50) + "..." : text;

              console.log(
                `[NOTIFICATION] 📤 Sending FCM notification to ${receiverType} ${otherMemberId}: "${notificationTitle}" - "${notificationBody}"`
              );

              const result = await sendFCMNotification(
                receiverPushToken,
                notificationTitle,
                notificationBody,
                {
                  type: "NEW_MESSAGE",
                  conversationId: conversationId,
                  sender: sender,
                  message: text,
                  senderName: senderName,
                }
              );

              if (result.success) {
                console.log(
                  `[NOTIFICATION] ✅ Push notification sent successfully to ${receiverType} ${otherMemberId} (${senderName} → ${
                    receiverType === "Shop" ? otherShop.name : otherUser.name
                  })`
                );
              } else {
                console.error(
                  `[NOTIFICATION] ❌ Failed to send push notification to ${otherMemberId}: ${result.error}`
                );
              }
            } else {
              console.log(
                `[NOTIFICATION] ⏭️ Skipping notification - no pushToken available for ${otherMemberId}`
              );
            }

            // Send notification to product owner if conversation is about a product
            if (conversation.productId) {
              try {
                console.log(`[PRODUCT NOTIFICATION] Conversation is about product: ${conversation.productId}`);
                
                const product = await Product.findById(conversation.productId).lean();
                if (product) {
                  let productOwnerId = null;
                  let productOwnerPushToken = null;
                  let productOwnerType = null;
                  let productOwnerName = null;

                  // Check if product has shopId (Shop-created product)
                  if (product.shopId) {
                    const productOwnerShop = await Shop.findById(product.shopId).lean();
                    if (productOwnerShop) {
                      productOwnerId = product.shopId;
                      productOwnerPushToken = productOwnerShop.pushToken || productOwnerShop.expoPushToken;
                      productOwnerType = "Shop";
                      productOwnerName = productOwnerShop.name;
                      console.log(`[PRODUCT NOTIFICATION] Product owned by Shop: ${productOwnerName} (${productOwnerId})`);
                    }
                  }
                  
                  // Check if product has userId (User-created product)
                  if (!productOwnerPushToken && product.userId) {
                    const productOwnerUser = await User.findById(product.userId).lean();
                    if (productOwnerUser) {
                      productOwnerId = product.userId;
                      productOwnerPushToken = productOwnerUser.pushToken;
                      productOwnerType = "User";
                      productOwnerName = productOwnerUser.name;
                      console.log(`[PRODUCT NOTIFICATION] Product owned by User: ${productOwnerName} (${productOwnerId})`);
                    }
                  }

                  // Send notification to product owner if:
                  // 1. Product owner found with push token
                  // 2. Product owner is not the sender
                  // 3. Product owner is not already the other member (to avoid duplicate notifications)
                  if (productOwnerPushToken && 
                      productOwnerId.toString() !== sender.toString() && 
                      productOwnerId.toString() !== otherMemberId.toString()) {
                    
                    const productNotificationTitle = `New message about ${product.name}`;
                    const productNotificationBody = `${senderName}: ${text.length > 50 ? text.substring(0, 50) + "..." : text}`;

                    console.log(
                      `[PRODUCT NOTIFICATION] 📤 Sending FCM notification to product owner ${productOwnerType} ${productOwnerId}: "${productNotificationTitle}" - "${productNotificationBody}"`
                    );

                    const productResult = await sendFCMNotification(
                      productOwnerPushToken,
                      productNotificationTitle,
                      productNotificationBody,
                      {
                        type: "NEW_MESSAGE",
                        conversationId: conversationId,
                        sender: sender,
                        message: text,
                        senderName: senderName,
                        productId: conversation.productId,
                        productName: product.name,
                      }
                    );

                    if (productResult.success) {
                      console.log(
                        `[PRODUCT NOTIFICATION] ✅ Push notification sent successfully to product owner ${productOwnerType} ${productOwnerId} (${productOwnerName})`
                      );
                    } else {
                      console.error(
                        `[PRODUCT NOTIFICATION] ❌ Failed to send push notification to product owner ${productOwnerId}: ${productResult.error}`
                      );
                    }
                  } else {
                    if (productOwnerId) {
                      if (!productOwnerPushToken) {
                        console.log(
                          `[PRODUCT NOTIFICATION] ⏭️ Skipping - no pushToken for product owner ${productOwnerId}`
                        );
                      } else if (productOwnerId.toString() === sender.toString()) {
                        console.log(
                          `[PRODUCT NOTIFICATION] ⏭️ Skipping - product owner is the sender`
                        );
                      } else if (productOwnerId.toString() === otherMemberId.toString()) {
                        console.log(
                          `[PRODUCT NOTIFICATION] ⏭️ Skipping - product owner already notified as other member`
                        );
                      }
                    } else {
                      console.log(
                        `[PRODUCT NOTIFICATION] ⏭️ Skipping - no product owner found`
                      );
                    }
                  }
                } else {
                  console.log(`[PRODUCT NOTIFICATION] ⚠️ Product not found: ${conversation.productId}`);
                }
              } catch (productNotifError) {
                console.error(
                  "[PRODUCT NOTIFICATION] ❌ Error in product notification handler:",
                  productNotifError
                );
              }
            }
          }
        } else {
          console.log(`[NOTIFICATION] ⚠️ Conversation not found or has no members`);
        }
      } catch (notifError) {
        console.error("=".repeat(80));
        console.error("[NOTIFICATION] ❌ Error in push notification handler:", notifError);
        console.error("[NOTIFICATION] Error message:", notifError.message);
        console.error("[NOTIFICATION] Error stack:", notifError.stack);
        console.error("=".repeat(80));
      }
      console.log("=".repeat(80));
      console.log("✅ [SEND-MESSAGE] Process complete");
      console.log("=".repeat(80));
    } catch (error) {
      console.error("=".repeat(80));
      console.error("❌ [SEND-MESSAGE] Error:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      console.error("=".repeat(80));
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // Mark messages as read
  socket.on("mark-as-read", async (data) => {
    try {
      const { userId, conversationId } = data;

      // Update all unread messages in this conversation (not sent by this user)
      await Messages.updateMany(
        {
          conversationId: conversationId,
          sender: { $ne: userId },
          read: { $ne: true },
        },
        { $set: { read: true } }
      );

      // Emit to all users in the room that messages are read
      const roomName = `chat-${conversationId}`;
      io.to(roomName).emit("messages-marked-read", {
        conversationId: conversationId,
        userId: userId,
      });

      console.log(`Messages marked as read in conversation ${conversationId}`);
    } catch (error) {
      console.error("Error marking messages as read:", error);
      socket.emit("error", { message: "Failed to mark messages as read" });
    }
  });

  // Handle typing indicator
  socket.on("typing", (data) => {
    const { conversationId, userId } = data;
    const roomName = `chat-${conversationId}`;
    socket.to(roomName).emit("user-typing", { userId, conversationId });
  });

  // Handle stop typing
  socket.on("stop-typing", (data) => {
    const { conversationId, userId } = data;
    const roomName = `chat-${conversationId}`;
    socket.to(roomName).emit("user-stopped-typing", { userId, conversationId });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// it's for error handling
app.use(ErrorHandler);

// Handling Uncaught Exceptions
process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`shutting down the server for handling UNCAUGHT EXCEPTION! 💥`);
});

// unhandled promise rejection
process.on("unhandledRejection", (err) => {
  console.log(`Shutting down the server for ${err.message}`);
  console.log(`shutting down the server for unhandle promise rejection`);

  server.close(() => {
    process.exit(1);
  });
});
