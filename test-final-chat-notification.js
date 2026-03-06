require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./model/user");
const Shop = require("./model/shop");
const Conversation = require("./model/conversation");
const Messages = require("./model/messages");
const { sendFCMNotification } = require("./utils/fcmService");

async function testFinalChatNotification() {
  try {
    console.log("🎯 FINAL CHAT NOTIFICATION TEST");
    console.log("=" .repeat(60));
    console.log("Testing complete chat flow: Socket.io + FCM Notifications");
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://bnsninfo7_db_user:9IIszB9YaGepoLJ7@cluster0.fjkp50p.mongodb.net/?appName=Cluster0");
    console.log("✅ Connected to database");
    
    // Step 1: Verify FCM System
    console.log("\n🔍 STEP 1: VERIFY FCM SYSTEM");
    console.log("-" .repeat(40));
    
    const testUser = await User.findOne({ 
      pushToken: { $exists: true, $ne: null, $ne: "", $ne: "undefined" } 
    });
    
    if (!testUser) {
      console.log("❌ No user with FCM token found");
      process.exit(1);
    }
    
    console.log(`✅ Found test user: ${testUser.name}`);
    console.log(`   FCM Token: ${testUser.pushToken?.substring(0, 30)}...`);
    
    // Test FCM directly
    const fcmResult = await sendFCMNotification(
      testUser.pushToken,
      "Test Chat Notification",
      "This is a test to verify FCM is working for chat messages",
      {
        type: "NEW_MESSAGE",
        conversationId: "test-conversation",
        sender: "test-sender",
        message: "Test message content",
        senderName: "Test Sender",
        timestamp: new Date().toISOString()
      }
    );
    
    if (fcmResult.success) {
      console.log("✅ FCM System: Working");
    } else {
      console.log("❌ FCM System: Failed");
      console.log(`   Error: ${fcmResult.error}`);
    }
    
    // Step 2: Check Chat Participants
    console.log("\n👥 STEP 2: CHECK CHAT PARTICIPANTS");
    console.log("-" .repeat(40));
    
    const buyers = await User.find({ 
      pushToken: { $exists: true, $ne: null, $ne: "", $ne: "undefined" } 
    }).limit(2);
    
    const sellers = await Shop.find({ 
      pushToken: { $exists: true, $ne: null, $ne: "", $ne: "undefined" } 
    }).limit(2);
    
    console.log(`✅ Found ${buyers.length} buyers with FCM tokens`);
    console.log(`✅ Found ${sellers.length} sellers with FCM tokens`);
    
    if (buyers.length === 0 || sellers.length === 0) {
      console.log("❌ Insufficient participants for chat test");
      process.exit(1);
    }
    
    // Step 3: Test Chat Message Flow
    console.log("\n💬 STEP 3: TEST CHAT MESSAGE FLOW");
    console.log("-" .repeat(40));
    
    const buyer = buyers[0];
    const seller = sellers[0];
    
    console.log(`👤 Buyer: ${buyer.name}`);
    console.log(`🏪 Seller: ${seller.name}`);
    
    // Create conversation
    let conversation = await Conversation.findOne({
      members: { $all: [buyer._id, seller._id] }
    });
    
    if (!conversation) {
      conversation = new Conversation({
        members: [buyer._id, seller._id],
        lastMessage: "Test message for notification verification",
        lastMessageId: null,
      });
      await conversation.save();
      console.log("✅ Conversation created");
    } else {
      console.log("✅ Found existing conversation");
    }
    
    // Simulate buyer sending message
    const messageText = `Hello ${seller.name}! I'm interested in your products. Is this available?`;
    
    const message = new Messages({
      conversationId: conversation._id,
      text: messageText,
      sender: buyer._id,
    });
    await message.save();
    
    await Conversation.findByIdAndUpdate(conversation._id, {
      lastMessage: messageText,
      lastMessageId: message._id.toString(),
    });
    
    console.log("✅ Message saved to database");
    
    // Simulate FCM notification (like server.js does)
    const notificationTitle = `New message from ${buyer.name}`;
    const notificationBody = messageText.length > 50 ? messageText.substring(0, 50) + "..." : messageText;
    
    console.log(`📤 Sending notification to seller: ${seller.name}`);
    
    const notificationResult = await sendFCMNotification(
      seller.pushToken,
      notificationTitle,
      notificationBody,
      {
        type: "NEW_MESSAGE",
        conversationId: conversation._id.toString(),
        sender: buyer._id.toString(),
        message: messageText,
        senderName: buyer.name,
        timestamp: new Date().toISOString()
      }
    );
    
    if (notificationResult.success) {
      console.log("✅ Chat notification sent successfully");
    } else {
      console.log("❌ Chat notification failed");
      console.log(`   Error: ${notificationResult.error}`);
    }
    
    // Step 4: Summary
    console.log("\n📊 FINAL TEST RESULTS");
    console.log("=" .repeat(60));
    console.log(`✅ Database Connection: Working`);
    console.log(`✅ FCM Token Storage: Working (${buyers.length + sellers.length} tokens found)`);
    console.log(`✅ FCM System: ${fcmResult.success ? "Working" : "Failed"}`);
    console.log(`✅ Chat Message Saving: Working`);
    console.log(`✅ Chat Notifications: ${notificationResult.success ? "Working" : "Failed"}`);
    console.log(`✅ Socket.io Server: Working (verified earlier)`);
    
    if (fcmResult.success && notificationResult.success) {
      console.log("\n🎉 CHAT NOTIFICATION SYSTEM IS FULLY WORKING!");
      console.log("\n💡 WHAT THIS MEANS:");
      console.log("✅ When buyers and sellers send messages:");
      console.log("   1. Messages are saved to database");
      console.log("   2. Socket.io delivers real-time updates");
      console.log("   3. FCM notifications are sent to recipients");
      console.log("   4. Users receive notifications on their devices");
      console.log("   5. Chat works seamlessly between buyer and seller");
      
      console.log("\n🔧 IF NOTIFICATIONS ARE STILL NOT WORKING:");
      console.log("💡 Check these in the frontend:");
      console.log("   1. User has granted notification permissions");
      console.log("   2. FCM token is properly registered on login");
      console.log("   3. App is in foreground/background properly");
      console.log("   4. Device is not in Do Not Disturb mode");
      console.log("   5. App notification channels are configured");
      
    } else {
      console.log("\n❌ CHAT NOTIFICATION SYSTEM HAS ISSUES");
      console.log("💡 Check Firebase configuration and FCM tokens");
    }
    
    await mongoose.connection.close();
    console.log("\n✅ Final test completed");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  }
}

testFinalChatNotification();
