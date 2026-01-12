/**
 * Test script to verify user notification on new message
 * Run this with: node test-user-notification.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./model/user");
const admin = require("firebase-admin");
const DB_URL = "mongodb+srv://qaudsinfo:Qauds123@cluster0.nyfuhwt.mongodb.net/qauds?retryWrites=true&w=majority&appName=Cluster0";

async function testUserNotification() {
  try {
    console.log("\n🔍 Testing User Notification System...");
    
    // Initialize Firebase Admin
    if (!admin.apps.length) {
      const serviceAccount = require("./config/firebase-service-account.json");
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("✅ Firebase initialized");
    }
    
    // Connect to database
    console.log("\n📊 Connecting to database...");
    await mongoose.connect(DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to database");

    // Find user by email
    const userEmail = "hemantr128@gmail.com";
    let user = await User.findOne({ email: userEmail });
    
    // If not found by email, try by phone
    if (!user) {
      const userPhone = "9340208047";
      user = await User.findOne({ phoneNumber: userPhone });
    }
    
    // If still not found, try by ID
    if (!user) {
      const userId = "68ff82f0f76b6a48055b3f74";
      user = await User.findById(userId);
    }
    
    // Override with FCM token from provided data
    if (user) {
      user.pushToken = "cWDZ-531SnC_XUbEI1EzwE:APA91bHKMrtOGNonMhNYp7w-6iVD8AatDkTlvUGIcUxF4cUEbGbc3I9qQ7RtiMcDPG70olEeNpIxkeVet8tiRhK-uMOh6bOt5v5RkQHjMOK0wrJKayy0FK4";
    }

    if (!user) {
      console.log("❌ User not found");
      process.exit(1);
    }

    console.log("\n👤 User found:");
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Phone: ${user.phoneNumber}`);
    console.log(`   Has Push Token: ${!!user.pushToken}`);
    
    if (!user.pushToken) {
      console.log("❌ User has no push token - cannot send notification");
      process.exit(1);
    }
    
    console.log(`   Push Token: ${user.pushToken.substring(0, 20)}...`);

    // Send test notification (simulating a new chat message)
    console.log("\n🔔 Sending test chat message notification...");
    
    const notificationTitle = "New message from Test User";
    const notificationBody = "This is a test message to verify notifications are working!";
    
    const message = {
      token: user.pushToken,
      notification: {
        title: notificationTitle,
        body: notificationBody,
      },
      android: {
        priority: "high",
        ttl: 3600000,
        notification: {
          title: notificationTitle,
          body: notificationBody,
          sound: "default",
          channelId: "default",
          priority: "high",
        },
      },
      apns: {
        headers: {
          "apns-priority": "10",
          "apns-push-type": "alert",
        },
        payload: {
          aps: {
            alert: {
              title: notificationTitle,
              body: notificationBody,
            },
            sound: "default",
            badge: 1,
          },
        },
      },
      data: {
        type: "NEW_MESSAGE",
        conversationId: "test-conversation-123",
        sender: "test-sender-456",
        message: "This is a test message to verify notifications are working!",
        senderName: "Test User",
        timestamp: new Date().toISOString()
      },
    };

    const result = await admin.messaging().send(message);

    console.log("\n✅ Notification sent successfully!");
    console.log(`   Message ID: ${result}`);
    console.log(`   Title: "${notificationTitle}"`);
    console.log(`   Body: "${notificationBody}"`);
    console.log("\n📱 Check your device for the notification!");

    // Close database connection
    await mongoose.connection.close();
    console.log("\n✅ Test completed");
    process.exit(0);

  } catch (error) {
    console.error("\n❌ Error during test:", error.message);
    console.error("Stack:", error.stack);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the test
testUserNotification();
