#!/usr/bin/env node
/**
 * Test script for chat FCM notifications.
 * Verifies that when User A sends a message to User B, User B receives an FCM push notification.
 *
 * Usage: node test-chat-fcm-notification.js
 *
 * Prerequisites:
 * - Backend server running
 * - MongoDB connected
 * - At least 2 users with valid pushToken in DB
 */

require("dotenv").config();
const mongoose = require("mongoose");
const { io } = require("socket.io-client");
const User = require("./model/user");
const Shop = require("./model/shop");
const Conversation = require("./model/conversation");
const { sendFCMNotification } = require("./utils/fcmService");

const SOCKET_URL = process.env.SOCKET_URL || "https://7ark.in";
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/bsns";

async function testChatFCMNotification() {
  console.log("\n🔔 CHAT FCM NOTIFICATION TEST");
  console.log("=".repeat(60));
  console.log("Testing: Message send → FCM notification to receiver\n");

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // 1. Find users with valid FCM tokens
    const usersWithToken = await User.find({
      pushToken: {
        $exists: true,
        $ne: null,
        $nin: ["", "undefined"],
      },
    })
      .select("_id name email pushToken")
      .limit(2)
      .lean();

    if (usersWithToken.length < 2) {
      // Fallback: also check Shops
      const shopsWithToken = await Shop.find({
        $or: [
          { pushToken: { $exists: true, $ne: null, $nin: ["", "undefined"] } },
          {
            expoPushToken: {
              $exists: true,
              $ne: null,
              $nin: ["", "undefined"],
            },
          },
        ],
      })
        .select("_id name pushToken expoPushToken")
        .limit(1)
        .lean();

      if (usersWithToken.length === 0 && shopsWithToken.length === 0) {
        console.log("❌ No users or shops with valid push tokens found.");
        console.log("   → Login from 2 devices to register FCM tokens.");
        process.exit(1);
      }

      if (usersWithToken.length < 2) {
        console.log("⚠️  Need at least 2 users with FCM tokens for full test.");
        console.log(
          `   Found ${usersWithToken.length} user(s), ${shopsWithToken.length} shop(s).\n`,
        );
      }
    }

    const userA = usersWithToken[0];
    const userB = usersWithToken[1] || usersWithToken[0]; // Use same if only 1

    console.log("👤 User A (sender):", userA.name, `(${userA._id})`);
    console.log("   Token:", userA.pushToken?.substring(0, 35) + "...\n");
    console.log("👤 User B (receiver):", userB.name, `(${userB._id})`);
    console.log("   Token:", userB.pushToken?.substring(0, 35) + "...\n");

    // 2. Get or create conversation
    let conversation = await Conversation.findOne({
      members: { $all: [userA._id, userB._id] },
    }).lean();

    if (!conversation) {
      const newConv = await Conversation.create({
        members: [userA._id, userB._id],
        buyerId: userA._id,
        sellerId: userB._id,
      });
      conversation = newConv.toObject();
      console.log("✅ Created new conversation:", conversation._id);
    } else {
      console.log("✅ Using existing conversation:", conversation._id);
    }

    // 3. Test FCM directly (simulate what server.js does)
    console.log("\n📤 Step 1: Send FCM notification to receiver (User B)...");
    const title = `New message from ${userA.name}`;
    const body = "Hello! Is this item still available?";

    const result = await sendFCMNotification(userB.pushToken, title, body, {
      type: "NEW_MESSAGE",
      conversationId: conversation._id.toString(),
      sender: userA._id.toString(),
      message: body,
      senderName: userA.name,
    });

    if (result.success) {
      console.log("✅ FCM notification sent successfully!");
      console.log("   → Check User B's device for the notification.\n");
    } else {
      console.log("❌ FCM notification failed:", result.error);
      console.log("   → Check Firebase config, token validity.\n");
    }

    // 4. Test via Socket.io (full flow)
    console.log("📤 Step 2: Send message via Socket.io (full flow)...");
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: false,
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Socket connect timeout")),
        10000,
      );
      socket.on("connect", () => {
        clearTimeout(timeout);
        console.log("   ✅ Socket connected");
        resolve();
      });
      socket.on("connect_error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    socket.emit("send-message", {
      conversationId: conversation._id.toString(),
      sender: userA._id.toString(),
      text: "Test message via Socket – check notification on other device!",
    });

    console.log("   ✅ send-message emitted");
    await new Promise((r) => setTimeout(r, 2000));
    socket.disconnect();
    console.log("   ✅ Socket disconnected\n");

    // Summary
    console.log("=".repeat(60));
    console.log("📊 TEST SUMMARY");
    console.log("=".repeat(60));
    console.log("• FCM service:", result.success ? "✅ Working" : "❌ Failed");
    console.log("• Receiver lookup: User/Shop with pushToken");
    console.log("• If no notification on device:");
    console.log("  1. Ensure receiver has logged in (FCM token stored)");
    console.log("  2. Check backend logs for [NOTIFICATION] lines");
    console.log("  3. Verify Firebase service account and FCM_SERVER_KEY");
    console.log("");
  } catch (err) {
    console.error("❌ Test error:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("✅ MongoDB disconnected");
    process.exit(0);
  }
}

testChatFCMNotification();
