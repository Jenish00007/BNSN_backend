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

const SIX_MONTHS_MS = 180 * 24 * 60 * 60 * 1000;
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
});

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
  }),
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
const paymentRoutes = require("./routes/payment");
const contactCreditsRoutes = require("./routes/contact-credits");

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
// Contact views / subscription / credits:
// Mounted at /v2 so routes match:
//  - GET    /v2/contact-views/:userId
//  - PUT    /v2/contact-views/:userId
//  - POST   /v2/contact-credits/add
//  - POST   /v2/subscription/activate
//  - GET    /v2/subscription/:userId
app.use("/v2", contactViewsRoutes);

// Payment routes for Razorpay integration
app.use("/v2/payment", paymentRoutes);
app.use("/v2/contact-credits", contactCreditsRoutes);

const markExpiredProducts = async () => {
  try {
    const now = new Date();
    const expiryThreshold = new Date(now.getTime() - SIX_MONTHS_MS);

    const result = await Product.updateMany(
      {
        status: "active",
        $or: [
          { expiresAt: { $lte: now } },
          { expiresAt: null, createdAt: { $lte: expiryThreshold } },
          {
            expiresAt: { $exists: false },
            createdAt: { $lte: expiryThreshold },
          },
        ],
      },
      {
        status: "inactive",
        inactiveAt: now,
        inactiveReason: "Automatically marked inactive after 30 days",
      },
    );

    if (result.modifiedCount) {
      console.log(
        `[Product Lifecycle] Marked ${result.modifiedCount} product(s) as inactive due to expiry`,
      );
    }
  } catch (error) {
    console.error(
      "[Product Lifecycle] Failed to mark expired products:",
      error,
    );
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
      console.log(`[SEND-MESSAGE] Data:`, {
        conversationId,
        sender,
        text: text.substring(0, 50),
      });

      // Validate input data
      if (!conversationId || !sender || !text) {
        console.log(`[SEND-MESSAGE] ❌ Invalid data: missing required fields`);
        socket.emit("error", {
          message: "Invalid message data: missing required fields",
        });
        return;
      }

      // Check if conversation exists, if not, create a temporary one for testing
      let conversation = await Conversation.findById(conversationId).lean();
      if (!conversation) {
        console.log(
          `[SEND-MESSAGE] ⚠️ Conversation not found, creating temporary conversation for testing`,
        );

        // Create a temporary conversation for testing purposes
        conversation = new Conversation({
          _id: conversationId,
          members: [sender, "system-test-user"],
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        try {
          await conversation.save();
          console.log(
            `[SEND-MESSAGE] ✅ Temporary conversation created for testing`,
          );
        } catch (saveError) {
          console.log(
            `[SEND-MESSAGE] ❌ Failed to create temporary conversation:`,
            saveError.message,
          );
          socket.emit("error", {
            message: "Failed to create conversation for testing",
          });
          return;
        }
      }

      // Skip chat gate checks for test conversations
      if (
        conversation.members &&
        conversation.members.includes("system-test-user")
      ) {
        console.log(
          `[SEND-MESSAGE] 🧪 Test conversation detected, skipping chat gates`,
        );
      } else {
        // Apply chat gates for real conversations
        const chatGate = await getChatBlockInfo(conversationId);
        if (chatGate.blocked) {
          console.log(
            `[SEND-MESSAGE] Conversation ${conversationId} is blocked: ${chatGate.reason}`,
          );
          socket.emit("chat-disabled", {
            conversationId,
            reason: chatGate.reason,
            productStatus: chatGate.productStatus || null,
          });
          return;
        }
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

      // Emit message to all users in room
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

      // Send push notification to other users (only for real conversations)
      if (!conversation.members?.includes("system-test-user")) {
        try {
          if (conversation?.members) {
            console.log(
              `[NOTIFICATION] Conversation has members: ${conversation.members.length}`,
            );
            console.log(
              `[NOTIFICATION] Conversation members:`,
              conversation.members,
            );
            console.log(`[NOTIFICATION] Sender:`, sender);

            // Find other member (not the sender)
            const otherMemberId = conversation.members.find(
              (member) => member.toString() !== sender.toString(),
            );

            console.log(`[NOTIFICATION] Other member ID:`, otherMemberId);

            if (
              otherMemberId &&
              otherMemberId.toString() !== sender.toString()
            ) {
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
                console.log(
                  `[NOTIFICATION] ⚠️ Sender not found as User or Shop`,
                );
              }

              // Try to find other member as Shop first, then User
              let receiverPushToken = null;
              let receiverType = null;

              const otherShop = await Shop.findById(otherMemberId).lean();
              const otherUser = await User.findById(otherMemberId).lean();

              console.log(
                `[NOTIFICATION] Looking up receiver - Shop: ${
                  otherShop ? "Found" : "Not found"
                }, User: ${otherUser ? "Found" : "Not found"}`,
              );

              if (otherShop) {
                // Check for pushToken, fcmToken, expoPushToken (backward compatibility)
                const shopToken =
                  otherShop.pushToken ||
                  otherShop.fcmToken ||
                  otherShop.expoPushToken;
                if (
                  shopToken &&
                  typeof shopToken === "string" &&
                  shopToken.trim() &&
                  shopToken !== "undefined"
                ) {
                  receiverPushToken = shopToken.trim();
                  receiverType = "Shop";
                  const tokenType = otherShop.pushToken
                    ? "pushToken"
                    : otherShop.fcmToken
                      ? "fcmToken"
                      : "expoPushToken";
                  console.log(
                    `[NOTIFICATION] ✅ Found Shop ${tokenType} for ${otherMemberId} (${
                      otherShop.name
                    }): ${receiverPushToken.substring(0, 20)}...`,
                  );
                }
              }

              if (!receiverPushToken && otherUser) {
                // Check pushToken and fcmToken (some clients may store as fcmToken)
                const userToken = otherUser.pushToken || otherUser.fcmToken;
                if (
                  userToken &&
                  typeof userToken === "string" &&
                  userToken.trim() &&
                  userToken !== "undefined"
                ) {
                  receiverPushToken = userToken.trim();
                  receiverType = "User";
                  console.log(
                    `[NOTIFICATION] ✅ Found User push token for ${otherMemberId} (${
                      otherUser.name
                    }): ${receiverPushToken.substring(0, 20)}...`,
                  );
                }
              }

              if (receiverPushToken) {
                const notificationTitle = `New message from ${senderName}`;
                const notificationBody =
                  text.length > 50 ? text.substring(0, 50) + "..." : text;

                console.log(
                  `[NOTIFICATION] 📤 Sending FCM notification to ${receiverType} ${otherMemberId}: "${notificationTitle}" - "${notificationBody}"`,
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
                  },
                );

                if (result.success) {
                  console.log(
                    `[NOTIFICATION] ✅ Push notification sent successfully to ${receiverType} ${otherMemberId} (${senderName} → ${
                      receiverType === "Shop" ? otherShop.name : otherUser.name
                    })`,
                  );
                } else {
                  console.error(
                    `[NOTIFICATION] ❌ Failed to send push notification to ${otherMemberId}: ${result.error}`,
                  );
                }
              } else {
                console.log(
                  `[NOTIFICATION] ⏭️ Skipping notification - no pushToken available for ${otherMemberId}`,
                );
              }
            } else {
              console.log(
                `[NOTIFICATION] ⚠️ No other member found in conversation`,
              );
            }
          } else {
            console.log(`[NOTIFICATION] ⚠️ Conversation has no members`);
          }
        } catch (notifError) {
          console.error("=".repeat(80));
          console.error(
            "[NOTIFICATION] ❌ Error in push notification handler:",
            notifError,
          );
          console.error("[NOTIFICATION] Error message:", notifError.message);
          console.error("[NOTIFICATION] Error stack:", notifError.stack);
          console.error("=".repeat(80));
        }
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
        { $set: { read: true } },
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
