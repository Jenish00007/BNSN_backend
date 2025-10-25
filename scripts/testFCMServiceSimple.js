const { sendFCMNotification, sendFCMNotificationToMultiple } = require("../utils/fcmService");

// Simple test without database connection
const testFCMService = async () => {
  try {
    console.log("🧪 Testing Local FCM Service (Simple Test)...\n");

    // Test token (replace with a valid token for testing)
    const testToken = "fKNK_NcFRsmKFuChMH30nQ:APA91bHOGtar1YWlHoyfwvUmCVGaV6gQ1rGNPbBO8NYo5W5vE0djS6Vbr8HfNB72yEfnfhfBCBWc8aYk_NP0irGmCNolo6oexgkLIxYfz218GiWcpDqNOao";

    // Test 1: Single notification
    console.log("1️⃣ Testing single FCM notification...");
    const singleResult = await sendFCMNotification(
      testToken,
      "Test Single Notification",
      "This is a test from the local FCM service",
      { testData: "single_notification" }
    );
    
    console.log("Single notification result:", JSON.stringify(singleResult, null, 2));

    // Test 2: Multiple notifications
    console.log("\n2️⃣ Testing multiple FCM notifications...");
    const multipleTokens = [testToken];
    
    const multipleResult = await sendFCMNotificationToMultiple(
      multipleTokens,
      "Test Multiple Notifications",
      "This is a test for multiple devices",
      { testData: "multiple_notification" }
    );
    
    console.log("Multiple notifications result:", JSON.stringify(multipleResult, null, 2));

    // Test 3: Error handling
    console.log("\n3️⃣ Testing error handling...");
    
    // Test with invalid token
    const errorResult = await sendFCMNotification(
      "invalid_token_12345",
      "Test Error",
      "This should fail"
    );
    console.log("Error handling result:", JSON.stringify(errorResult, null, 2));

    // Test with missing parameters
    const missingParamsResult = await sendFCMNotification(
      "",
      "",
      ""
    );
    console.log("Missing parameters result:", JSON.stringify(missingParamsResult, null, 2));

    console.log("\n✅ FCM Service testing completed!");

  } catch (error) {
    console.error("❌ Error testing FCM service:", error);
  }
};

// Run the test
testFCMService();
