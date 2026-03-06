require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./model/user");
const { sendFCMNotification } = require("./utils/fcmService");

async function testFCMNotification() {
  try {
    console.log("🧪 TESTING FCM NOTIFICATION SYSTEM");
    console.log("=" .repeat(50));
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://bnsninfo7_db_user:9IIszB9YaGepoLJ7@cluster0.fjkp50p.mongodb.net/?appName=Cluster0");
    console.log("✅ Connected to database");
    
    // Find a user with valid FCM token
    const user = await User.findOne({ 
      pushToken: { $exists: true, $ne: null, $ne: "", $ne: "undefined" } 
    });
    
    if (!user) {
      console.log("❌ No user with valid FCM token found");
      process.exit(1);
    }
    
    console.log("\n👤 TEST USER:");
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   FCM Token: ${user.pushToken?.substring(0, 30)}...`);
    
    // Test 1: Simple notification
    console.log("\n📤 TEST 1: Simple Notification");
    console.log("-" .repeat(30));
    
    const result1 = await sendFCMNotification(
      user.pushToken,
      "Test Notification",
      "This is a test message to verify FCM is working",
      {
        type: "TEST",
        timestamp: new Date().toISOString()
      }
    );
    
    console.log("Result:", result1.success ? "✅ SUCCESS" : "❌ FAILED");
    if (!result1.success) {
      console.log("Error:", result1.error);
    }
    
    // Test 2: Chat message notification
    console.log("\n📤 TEST 2: Chat Message Notification");
    console.log("-" .repeat(30));
    
    const result2 = await sendFCMNotification(
      user.pushToken,
      "New message from Test Sender",
      "Hello! This is a test chat message notification",
      {
        type: "NEW_MESSAGE",
        conversationId: "test-conversation-123",
        sender: "test-sender-456",
        message: "Hello! This is a test chat message notification",
        senderName: "Test Sender",
        timestamp: new Date().toISOString()
      }
    );
    
    console.log("Result:", result2.success ? "✅ SUCCESS" : "❌ FAILED");
    if (!result2.success) {
      console.log("Error:", result2.error);
    }
    
    // Summary
    console.log("\n📊 TEST SUMMARY");
    console.log("=" .repeat(50));
    console.log(`Simple Notification: ${result1.success ? "✅ Working" : "❌ Failed"}`);
    console.log(`Chat Notification: ${result2.success ? "✅ Working" : "❌ Failed"}`);
    
    if (result1.success && result2.success) {
      console.log("\n🎉 FCM NOTIFICATION SYSTEM IS WORKING!");
      console.log("✅ Users should receive notifications when:");
      console.log("   - Chat messages are sent");
      console.log("   - Orders are placed");
      console.log("   - Other events trigger notifications");
    } else {
      console.log("\n❌ FCM NOTIFICATION SYSTEM HAS ISSUES");
      console.log("💡 Check Firebase configuration");
      console.log("💡 Verify FCM tokens are valid");
      console.log("💡 Check network connectivity");
    }
    
    await mongoose.connection.close();
    console.log("\n✅ Test completed");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  }
}

testFCMNotification();
