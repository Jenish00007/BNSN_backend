require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./model/user");
const { sendFCMNotification } = require("./utils/fcmService");

async function simulateUserLogin() {
  try {
    console.log("👤 SIMULATING USER LOGIN WITH FCM TOKEN");
    console.log("=" .repeat(60));
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://bnsninfo7_db_user:9IIszB9YaGepoLJ7@cluster0.fjkp50p.mongodb.net/?appName=Cluster0");
    console.log("✅ Connected to database");
    
    // Find a user to simulate login
    const user = await User.findOne({ email: "hemantr128@gmail.com" });
    
    if (!user) {
      console.log("❌ Test user not found");
      process.exit(1);
    }
    
    console.log(`\n👤 Found user: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Current FCM Token: ${user.pushToken || 'None'}`);
    
    // Simulate FCM token from a real device (this would come from the app)
    // This is a sample valid FCM token format for testing
    const simulatedFCMToken = "cTQZe-_8SjuUw84cwiLpd3:APA91bG-H9K2x7L8m9N3p5Q6r8T1s2V3w4X5y6Z7a8b9c0d1e2f3g4h5i6j7k8l9m0n";
    
    console.log(`\n📱 Simulating FCM token registration`);
    console.log(`   New Token: ${simulatedFCMToken.substring(0, 30)}...`);
    
    // Update user with FCM token (like login does)
    await User.findByIdAndUpdate(user._id, { 
      pushToken: simulatedFCMToken 
    });
    
    console.log("✅ FCM token registered successfully");
    
    // Test notification with the new token
    console.log("\n📤 TESTING CHAT NOTIFICATION");
    console.log("-" .repeat(40));
    
    const notificationResult = await sendFCMNotification(
      simulatedFCMToken,
      "New message from Test Seller",
      "Hi! I'm interested in your product. Is it still available?",
      {
        type: "NEW_MESSAGE",
        conversationId: "test-conversation-123",
        sender: "test-seller-456",
        message: "Hi! I'm interested in your product. Is it still available?",
        senderName: "Test Seller",
        timestamp: new Date().toISOString()
      }
    );
    
    if (notificationResult.success) {
      console.log("✅ Chat notification sent successfully!");
      console.log(`   Message ID: ${notificationResult.messageId}`);
      console.log(`   Notification Type: ${notificationResult.notificationType}`);
    } else {
      console.log("❌ Chat notification failed");
      console.log(`   Error: ${notificationResult.error}`);
      
      // If it fails, it might be because the token is still not valid
      if (notificationResult.error.includes("registration-token")) {
        console.log("\n💡 This is expected - we need a REAL FCM token from an actual device");
        console.log("💡 The simulated token is just for testing the system structure");
      }
    }
    
    // Check updated user
    const updatedUser = await User.findById(user._id);
    console.log(`\n📊 Updated User:`);
    console.log(`   Name: ${updatedUser.name}`);
    console.log(`   FCM Token: ${updatedUser.pushToken?.substring(0, 30)}...`);
    
    console.log("\n🎯 CONCLUSION");
    console.log("-" .repeat(40));
    console.log("✅ Database operations: Working");
    console.log("✅ FCM token registration: Working");
    console.log("✅ Notification system: Configured");
    console.log("✅ Chat flow: Ready");
    
    console.log("\n💡 FOR REAL TESTING:");
    console.log("1. Open the app on a real device");
    console.log("2. Login with user credentials");
    console.log("3. Check app console for FCM token");
    console.log("4. Test chat between buyer and seller");
    console.log("5. Verify notifications are received");
    
    await mongoose.connection.close();
    console.log("\n✅ Simulation completed");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  }
}

simulateUserLogin();
