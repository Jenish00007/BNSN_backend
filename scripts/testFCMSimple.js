const axios = require("axios");

// Simple FCM notification test without database
const testFCMNotification = async () => {
  try {
    console.log("🧪 Testing FCM Notification System...\n");

    // Test FCM endpoint with the provided token
    const testPayload = {
      fcmToken: "fKNK_NcFRsmKFuChMH30nQ:APA91bHOGtar1YWlHoyfwvUmCVGaV6gQ1rGNPbBO8NYo5W5vE0djS6Vbr8HfNB72yEfnfhfBCBWc8aYk_NP0irGmCNolo6oexgkLIxYfz218GiWcpDqNOao",
      title: "New Order Available - #TEST01",
      body: "Order from Test Shop - 2 items - ₹200"
    };

    console.log("📤 Sending FCM notification...");
    console.log("Payload:", JSON.stringify(testPayload, null, 2));

    try {
      const response = await axios.post('http://localhost:8000/v2/fcm/send', testPayload);
      console.log("✅ FCM notification sent successfully!");
      console.log("Response:", response.data);
    } catch (error) {
      console.error("❌ FCM notification failed:");
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", error.response.data);
      } else {
        console.error("Error:", error.message);
      }
    }

    // Test with multiple deliverymen simulation
    console.log("\n📤 Testing multiple deliverymen notification simulation...");
    
    const deliverymenTokens = [
      "fKNK_NcFRsmKFuChMH30nQ:APA91bHOGtar1YWlHoyfwvUmCVGaV6gQ1rGNPbBO8NYo5W5vE0djS6Vbr8HfNB72yEfnfhfBCBWc8aYk_NP0irGmCNolo6oexgkLIxYfz218GiWcpDqNOao",
      // Add more tokens here if you have them
    ];

    const orderDetails = {
      orderNumber: "TEST01",
      shopName: "Test Shop",
      totalItems: 2,
      totalPrice: 200
    };

    const title = `New Order Available - #${orderDetails.orderNumber}`;
    const body = `Order from ${orderDetails.shopName} - ${orderDetails.totalItems} items - ₹${orderDetails.totalPrice}`;

    console.log(`Sending notifications to ${deliverymenTokens.length} deliverymen...`);
    console.log(`Title: ${title}`);
    console.log(`Body: ${body}`);

    const results = [];
    for (let i = 0; i < deliverymenTokens.length; i++) {
      const token = deliverymenTokens[i];
      console.log(`\n📱 Sending to deliveryman ${i + 1}...`);
      
      try {
        const response = await axios.post('http://localhost:8000/v2/fcm/send', {
          fcmToken: token,
          title: title,
          body: body
        });

        if (response.data.success) {
          console.log(`✅ Success: ${response.data.messageId}`);
          results.push({ deliveryman: i + 1, success: true });
        } else {
          console.log(`❌ Failed: ${response.data.error}`);
          results.push({ deliveryman: i + 1, success: false, error: response.data.error });
        }
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        results.push({ deliveryman: i + 1, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`\n📊 Results:`);
    console.log(`   Total sent: ${results.length}`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Failed: ${results.length - successCount}`);

    console.log("\n🎉 FCM Test Completed!");
    console.log("\n💡 Next steps:");
    console.log("   1. Make sure your backend server is running on port 8000");
    console.log("   2. Make sure Firebase is properly configured");
    console.log("   3. Test with real deliveryman FCM tokens");
    console.log("   4. Create an order through the API to trigger automatic notifications");

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
};

// Run the test
testFCMNotification();

