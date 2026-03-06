require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./model/user");
const { sendFCMNotification } = require("./utils/fcmService");

async function testYourNotification() {
  try {
    console.log("📱 TESTING NOTIFICATION FOR YOUR DEVICE");
    console.log("=" .repeat(50));
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://bnsninfo7_db_user:9IIszB9YaGepoLJ7@cluster0.fjkp50p.mongodb.net/?appName=Cluster0");
    console.log("✅ Connected to database");
    
    // Find your user
    const user = await User.findOne({ email: "hemantr128@gmail.com" });
    
    if (!user) {
      console.log("❌ User not found");
      process.exit(1);
    }
    
    console.log(`\n👤 Found user: ${user.name}`);
    console.log(`📱 FCM Token: ${user.pushToken?.substring(0, 50)}...`);
    
    if (!user.pushToken || user.pushToken === "undefined") {
      console.log("❌ No valid FCM token found");
      console.log("💡 You need to login to the app again to get a fresh token");
      process.exit(1);
    }
    
    // Test notification
    console.log("\n📤 SENDING TEST NOTIFICATION TO YOUR DEVICE");
    console.log("-" .repeat(50));
    
    const result = await sendFCMNotification(
      user.pushToken,
      "Test Chat Message",
      "This is a test notification to verify your device receives notifications",
      {
        type: "NEW_MESSAGE",
        conversationId: "test-conversation",
        sender: "test-sender",
        message: "This is a test message",
        senderName: "Test Sender",
        timestamp: new Date().toISOString()
      }
    );
    
    console.log("\n📊 NOTIFICATION RESULT:");
    console.log("-" .repeat(50));
    
    if (result.success) {
      console.log("✅ SUCCESS! Notification sent to your device");
      console.log(`📱 Message ID: ${result.messageId}`);
      console.log(`🔔 You should receive a notification on your phone now`);
      console.log(`📝 Title: "Test Chat Message"`);
      console.log(`📄 Body: "This is a test notification to verify your device receives notifications"`);
      
      console.log("\n💡 IF YOU DIDN'T RECEIVE:");
      console.log("1. Check if app is installed and notifications are enabled");
      console.log("2. Check phone's notification settings");
      console.log("3. Check if app is in background or closed");
      console.log("4. Check if Do Not Disturb is off");
      console.log("5. Check if app has notification permissions");
      
    } else {
      console.log("❌ FAILED to send notification");
      console.log(`🔴 Error: ${result.error}`);
      
      if (result.error.includes("registration-token")) {
        console.log("\n💡 TOKEN ISSUE DETECTED:");
        console.log("The FCM token is invalid or expired");
        console.log("You need to login to the app again to get a fresh token");
        console.log("\n📝 STEPS TO FIX:");
        console.log("1. Open the app on your phone");
        console.log("2. Logout and login again");
        console.log("3. Check app console for new FCM token");
        console.log("4. Try this test again");
      }
    }
    
    await mongoose.connection.close();
    console.log("\n✅ Test completed");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

testYourNotification();
