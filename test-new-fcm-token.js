require("dotenv").config();
const mongoose = require("mongoose");
const { sendFCMNotification } = require("./utils/fcmService");

async function testNewFCMToken() {
  try {
    console.log("📱 TESTING NEW FCM TOKEN FROM YOUR DEVICE");
    console.log("=" .repeat(60));
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://bnsninfo7_db_user:9IIszB9YaGepoLJ7@cluster0.fjkp50p.mongodb.net/?appName=Cluster0");
    console.log("✅ Connected to database");
    
    // The new FCM token from your app logs
    const newFCMToken = "cTQZe-_8SjuUw84cwiLpd3:APA91bGWmVqtpZjLpQqHbMevb4Mf1pyBCF2I6i9Vh_IeD-s7kMlBT47bFBC_OhjyalzF7EE0FpLAU09_b-M0IG9cMuhiQ-Vmg7BOA-HHAFGOHy6m0Lky0es";
    
    console.log(`📱 Testing with new token: ${newFCMToken.substring(0, 50)}...`);
    
    // Test notification
    console.log("\n📤 SENDING TEST NOTIFICATION");
    console.log("-" .repeat(40));
    
    const result = await sendFCMNotification(
      newFCMToken,
      "Test Chat Message",
      "This is a test notification from the backend to your device",
      {
        type: "NEW_MESSAGE",
        conversationId: "test-conversation-123",
        sender: "test-sender-456",
        message: "This is a test message to verify notifications work",
        senderName: "Test Sender",
        timestamp: new Date().toISOString()
      }
    );
    
    console.log("\n📊 NOTIFICATION RESULT:");
    console.log("-" .repeat(40));
    
    if (result.success) {
      console.log("🎉 SUCCESS! Notification sent to your device!");
      console.log(`📱 Message ID: ${result.messageId}`);
      console.log(`🔔 You should receive a notification on your phone NOW!`);
      console.log(`📝 Title: "Test Chat Message"`);
      console.log(`📄 Body: "This is a test notification from the backend to your device"`);
      
      console.log("\n✅ NOTIFICATION SYSTEM IS WORKING!");
      console.log("💡 The issue was that the token wasn't being saved to the database during login");
      
    } else {
      console.log("❌ FAILED to send notification");
      console.log(`🔴 Error: ${result.error}`);
      
      if (result.error.includes("registration-token")) {
        console.log("\n💡 TOKEN ISSUE:");
        console.log("The token might be invalid or there's a configuration issue");
        console.log("Let's check the Firebase configuration...");
      }
    }
    
    await mongoose.connection.close();
    console.log("\n✅ Test completed");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

testNewFCMToken();
