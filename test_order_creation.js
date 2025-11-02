const axios = require("axios");

// Test order creation and FCM notification
const testOrderCreation = async () => {
  try {
    console.log("🧪 Testing Order Creation and FCM Notification System...\n");

    // First, let's test if we can create a deliveryman with FCM token
    console.log("📱 Step 1: Creating a test deliveryman with FCM token...");
    
    const deliverymanData = {
      name: "Test Deliveryman",
      email: "test.deliveryman@example.com",
      password: "123456",
      phoneNumber: "9876543210",
      address: "Test Address",
      vehicleType: "bike",
      vehicleNumber: "TN01AB1234",
      licenseNumber: "DL123456789",
      idProof: "test_id_proof.jpg",
      expoPushToken: "fKNK_NcFRsmKFuChMH30nQ:APA91bHOGtar1YWlHoyfwvUmCVGaV6gQ1rGNPbBO8NYo5W5vE0djS6Vbr8HfNB72yEfnfhfBCBWc8aYk_NP0irGmCNolo6oexgkLIxYfz218GiWcpDqNOao",
      isApproved: true,
      isAvailable: true
    };

    try {
      const deliverymanResponse = await axios.post('http://localhost:8000/v2/deliveryman/create-deliveryman', deliverymanData);
      console.log("✅ Test deliveryman created successfully");
      console.log("Deliveryman ID:", deliverymanResponse.data.deliveryman._id);
    } catch (error) {
      if (error.response && error.response.status === 400 && error.response.data.message.includes("already exists")) {
        console.log("ℹ️  Test deliveryman already exists, continuing...");
      } else {
        console.error("❌ Error creating deliveryman:", error.response?.data || error.message);
        return;
      }
    }

    // Step 2: Test FCM notification directly
    console.log("\n📤 Step 2: Testing FCM notification directly...");
    
    const fcmPayload = {
      fcmToken: "fKNK_NcFRsmKFuChMH30nQ:APA91bHOGtar1YWlHoyfwvUmCVGaV6gQ1rGNPbBO8NYo5W5vE0djS6Vbr8HfNB72yEfnfhfBCBWc8aYk_NP0irGmCNolo6oexgkLIxYfz218GiWcpDqNOao",
      title: "Test Order Notification",
      body: "This is a test notification for order creation"
    };

    try {
      const fcmResponse = await axios.post('http://localhost:8000/v2/fcm/send', fcmPayload);
      console.log("✅ FCM notification sent successfully");
      console.log("Message ID:", fcmResponse.data.messageId);
    } catch (error) {
      console.error("❌ FCM notification failed:", error.response?.data || error.message);
      return;
    }

    // Step 3: Test order creation (this should trigger FCM notifications)
    console.log("\n🛒 Step 3: Testing order creation (should trigger FCM notifications)...");
    
    // First, we need to create a user and get auth token
    console.log("Creating test user...");
    const userData = {
      name: "Test User",
      email: "test.user@example.com",
      password: "123456",
      phoneNumber: "9876543210"
    };

    let authToken;
    try {
      const userResponse = await axios.post('http://localhost:8000/v2/user/create-user', userData);
      console.log("✅ Test user created successfully");
      
      // Login to get token
      const loginResponse = await axios.post('http://localhost:8000/v2/user/login-user', {
        email: userData.email,
        password: userData.password
      });
      authToken = loginResponse.data.token;
      console.log("✅ User logged in successfully");
    } catch (error) {
      if (error.response && error.response.status === 400 && error.response.data.message.includes("already exists")) {
        console.log("ℹ️  Test user already exists, logging in...");
        const loginResponse = await axios.post('http://localhost:8000/v2/user/login-user', {
          email: userData.email,
          password: userData.password
        });
        authToken = loginResponse.data.token;
        console.log("✅ User logged in successfully");
      } else {
        console.error("❌ Error creating/logging in user:", error.response?.data || error.message);
        return;
      }
    }

    // Create a test order
    const orderData = {
      cart: [
        {
          _id: "test_product_id",
          shopId: "test_shop_id",
          qty: 2,
          price: 100,
          name: "Test Product",
          images: [{ url: "test_image.jpg" }]
        }
      ],
      shippingAddress: {
        address: "Test Address",
        city: "Test City",
        state: "Test State",
        zipCode: "123456",
        country: "Test Country"
      },
      totalPrice: 200,
      paymentInfo: {
        type: "COD",
        status: "Pending"
      },
      userLocation: {
        latitude: 12.9716,
        longitude: 77.5946
      }
    };

    try {
      console.log("Creating test order...");
      const orderResponse = await axios.post('http://localhost:8000/v2/order/create-order', orderData, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log("✅ Order created successfully");
      console.log("Order ID:", orderResponse.data.orders[0]._id);
      console.log("OTP:", orderResponse.data.otps[0]);
      
      // The FCM notifications should have been triggered automatically
      console.log("\n🎉 Order creation test completed!");
      console.log("📱 Check if FCM notifications were sent to deliverymen");
      
    } catch (error) {
      console.error("❌ Error creating order:", error.response?.data || error.message);
    }

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
};

// Run the test
testOrderCreation();

