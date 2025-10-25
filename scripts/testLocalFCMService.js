const mongoose = require("mongoose");
const { sendFCMNotification, sendFCMNotificationToMultiple, sendFCMNotificationToDeliverymen } = require("../utils/fcmService");
const DeliveryMan = require("../model/deliveryman");
const Order = require("../model/order");

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Test the new FCM service
const testLocalFCMService = async () => {
  try {
    console.log("🧪 Testing Local FCM Service...\n");

    // Test 1: Single notification
    console.log("1️⃣ Testing single FCM notification...");
    const testToken = "fKNK_NcFRsmKFuChMH30nQ:APA91bHOGtar1YWlHoyfwvUmCVGaV6gQ1rGNPbBO8NYo5W5vE0djS6Vbr8HfNB72yEfnfhfBCBWc8aYk_NP0irGmCNolo6oexgkLIxYfz218GiWcpDqNOao";
    
    const singleResult = await sendFCMNotification(
      testToken,
      "Test Single Notification",
      "This is a test from the local FCM service"
    );
    
    console.log("Single notification result:", singleResult);

    // Test 2: Multiple notifications
    console.log("\n2️⃣ Testing multiple FCM notifications...");
    const multipleTokens = [
      testToken,
      // Add more tokens if available
    ];
    
    const multipleResult = await sendFCMNotificationToMultiple(
      multipleTokens,
      "Test Multiple Notifications",
      "This is a test for multiple devices"
    );
    
    console.log("Multiple notifications result:", multipleResult);

    // Test 3: Deliverymen notification (if deliverymen exist in DB)
    console.log("\n3️⃣ Testing deliverymen FCM notifications...");
    
    const deliverymen = await DeliveryMan.find({
      isAvailable: true,
      isApproved: true,
      expoPushToken: { $exists: true, $ne: null, $ne: '' }
    }).select('expoPushToken name _id').limit(3);

    console.log(`Found ${deliverymen.length} deliverymen with FCM tokens`);

    if (deliverymen.length > 0) {
      // Create a mock order for testing
      const mockOrder = {
        _id: new mongoose.Types.ObjectId(),
        cart: [
          {
            shopId: { name: "Test Shop" },
            quantity: 2
          }
        ],
        totalPrice: 250
      };

      const deliverymenResult = await sendFCMNotificationToDeliverymen(deliverymen, mockOrder);
      console.log("Deliverymen notifications result:", deliverymenResult);
    } else {
      console.log("No deliverymen found with FCM tokens for testing");
    }

    // Test 4: Error handling
    console.log("\n4️⃣ Testing error handling...");
    
    // Test with invalid token
    const errorResult = await sendFCMNotification(
      "invalid_token",
      "Test Error",
      "This should fail"
    );
    console.log("Error handling result:", errorResult);

    // Test with missing parameters
    const missingParamsResult = await sendFCMNotification(
      "",
      "",
      ""
    );
    console.log("Missing parameters result:", missingParamsResult);

    console.log("\n✅ FCM Service testing completed!");

  } catch (error) {
    console.error("❌ Error testing FCM service:", error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await testLocalFCMService();
  
  console.log("\n🏁 Test completed. Closing database connection...");
  await mongoose.connection.close();
  process.exit(0);
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the test
main();
