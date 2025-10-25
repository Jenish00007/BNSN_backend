const mongoose = require("mongoose");
const axios = require("axios");
require("dotenv").config();

// Import models
const Order = require("../model/order");
const DeliveryMan = require("../model/deliveryman");
const User = require("../model/user");
const Shop = require("../model/shop");

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Test FCM notification function
const testFCMNotification = async () => {
  try {
    console.log("🧪 Testing FCM Notification System...\n");

    // Test 1: Check if FCM endpoint is working
    console.log("1️⃣ Testing FCM endpoint...");
    const testPayload = {
      fcmToken: "fKNK_NcFRsmKFuChMH30nQ:APA91bHOGtar1YWlHoyfwvUmCVGaV6gQ1rGNPbBO8NYo5W5vE0djS6Vbr8HfNB72yEfnfhfBCBWc8aYk_NP0irGmCNolo6oexgkLIxYfz218GiWcpDqNOao",
      title: "Test Notification",
      body: "This is a test notification from the backend"
    };

    try {
      const response = await axios.post('http://localhost:8000/v2/fcm/send', testPayload);
      console.log("✅ FCM endpoint test successful:", response.data);
    } catch (error) {
      console.error("❌ FCM endpoint test failed:", error.message);
      return;
    }

    // Test 2: Check deliverymen with FCM tokens
    console.log("\n2️⃣ Checking deliverymen with FCM tokens...");
    const deliverymen = await DeliveryMan.find({
      isAvailable: true,
      isApproved: true,
      expoPushToken: { $exists: true, $ne: null, $ne: '' }
    }).select('expoPushToken name email');

    console.log(`Found ${deliverymen.length} available deliverymen with FCM tokens:`);
    deliverymen.forEach((dm, index) => {
      console.log(`  ${index + 1}. ${dm.name} (${dm.email}) - Token: ${dm.expoPushToken.substring(0, 20)}...`);
    });

    if (deliverymen.length === 0) {
      console.log("⚠️  No deliverymen found with FCM tokens. Creating a test deliveryman...");
      
      // Create a test deliveryman
      const testDeliveryman = new DeliveryMan({
        name: "Test Deliveryman",
        email: "test.deliveryman@example.com",
        password: "password123",
        phoneNumber: "+1234567890",
        address: "Test Address",
        vehicleType: "bike",
        vehicleNumber: "TEST123",
        licenseNumber: "LIC123456",
        idProof: "test_proof.jpg",
        isApproved: true,
        isAvailable: true,
        expoPushToken: "fKNK_NcFRsmKFuChMH30nQ:APA91bHOGtar1YWlHoyfwvUmCVGaV6gQ1rGNPbBO8NYo5W5vE0djS6Vbr8HfNB72yEfnfhfBCBWc8aYk_NP0irGmCNolo6oexgkLIxYfz218GiWcpDqNOao"
      });

      await testDeliveryman.save();
      console.log("✅ Test deliveryman created");
    }

    // Test 3: Create a test order and trigger notifications
    console.log("\n3️⃣ Testing order creation with FCM notifications...");
    
    // Find or create a test user
    let testUser = await User.findOne({ email: "test.user@example.com" });
    if (!testUser) {
      testUser = new User({
        name: "Test User",
        email: "test.user@example.com",
        password: "password123",
        phoneNumber: "+1234567890"
      });
      await testUser.save();
      console.log("✅ Test user created");
    }

    // Find or create a test shop
    let testShop = await Shop.findOne({ name: "Test Shop" });
    if (!testShop) {
      testShop = new Shop({
        name: "Test Shop",
        email: "test.shop@example.com",
        password: "password123",
        phoneNumber: "+1234567890",
        address: "Test Shop Address"
      });
      await testShop.save();
      console.log("✅ Test shop created");
    }

    // Create a test order
    const testOrder = new Order({
      cart: [{
        product: new mongoose.Types.ObjectId(),
        shopId: testShop._id,
        quantity: 2,
        price: 100,
        name: "Test Product",
        images: ["test-image.jpg"]
      }],
      shippingAddress: {
        address: "Test Shipping Address",
        city: "Test City",
        country: "Test Country"
      },
      user: {
        _id: testUser._id,
        name: testUser.name,
        email: testUser.email,
        phoneNumber: testUser.phoneNumber
      },
      shop: testShop._id,
      totalPrice: 200,
      paymentInfo: {
        id: "test_payment_id",
        status: "Succeeded",
        type: "Cash on Delivery"
      },
      userLocation: {
        latitude: 28.6139,
        longitude: 77.2090,
        deliveryAddress: "Test Delivery Address"
      },
      otp: "123456"
    });

    await testOrder.save();
    console.log("✅ Test order created:", testOrder._id);

    // Test 4: Send FCM notifications to deliverymen
    console.log("\n4️⃣ Sending FCM notifications to deliverymen...");
    
    const availableDeliverymen = await DeliveryMan.find({
      isAvailable: true,
      isApproved: true,
      expoPushToken: { $exists: true, $ne: null, $ne: '' }
    }).select('expoPushToken name');

    const orderNumber = testOrder._id.toString().slice(-6).toUpperCase();
    const shopName = "Test Shop";
    const totalItems = testOrder.cart.reduce((total, item) => total + item.quantity, 0);
    
    const title = `New Order Available - #${orderNumber}`;
    const body = `Order from ${shopName} - ${totalItems} items - ₹${testOrder.totalPrice}`;

    console.log(`Sending notifications to ${availableDeliverymen.length} deliverymen...`);
    console.log(`Title: ${title}`);
    console.log(`Body: ${body}`);

    const results = [];
    for (const deliveryman of availableDeliverymen) {
      try {
        const response = await axios.post('http://localhost:8000/v2/fcm/send', {
          fcmToken: deliveryman.expoPushToken,
          title: title,
          body: body
        });

        if (response.data.success) {
          console.log(`✅ FCM notification sent successfully to: ${deliveryman.name}`);
          results.push({ deliveryman: deliveryman.name, success: true });
        } else {
          console.log(`❌ Failed to send FCM notification to: ${deliveryman.name} - ${response.data.error}`);
          results.push({ deliveryman: deliveryman.name, success: false, error: response.data.error });
        }
      } catch (error) {
        console.log(`❌ Error sending FCM notification to: ${deliveryman.name} - ${error.message}`);
        results.push({ deliveryman: deliveryman.name, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`\n📊 FCM Notification Results:`);
    console.log(`   Total sent: ${results.length}`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Failed: ${results.length - successCount}`);

    // Clean up test data
    console.log("\n🧹 Cleaning up test data...");
    await Order.findByIdAndDelete(testOrder._id);
    console.log("✅ Test order deleted");

    console.log("\n🎉 FCM Notification Test Completed!");

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
};

// Run the test
const runTest = async () => {
  await connectDB();
  await testFCMNotification();
  process.exit(0);
};

runTest();
