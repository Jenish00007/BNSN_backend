/**
 * Test script to verify seller notification on new order with separate Firebase
 * Run this with: node test-seller-notification.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Shop = require("./model/shop");
const Order = require("./model/order");
const { sendFCMNotificationToSeller } = require("./utils/fcmService");
const fs = require("fs");
const path = require("path");
const DB_URL="mongodb+srv://qaudsinfo:Qauds123@cluster0.nyfuhwt.mongodb.net/qauds?retryWrites=true&w=majority&appName=Cluster0";

async function testSellerNotification() {
  try {
    // Check Firebase configuration
    const sellerFirebasePath = path.join(__dirname, "config", "firebase-seller-service-account.json");
    const defaultFirebasePath = path.join(__dirname, "config", "firebase-service-account.json");
    
    console.log("\n🔍 Checking Firebase Configuration...");
    
    if (fs.existsSync(sellerFirebasePath)) {
      console.log("✅ Seller Firebase service account found");
      console.log("   Using separate Firebase for seller notifications");
    } else {
      console.log("⚠️  Seller Firebase service account NOT found");
      console.log("   Using default Firebase for seller notifications");
      console.log("   To use separate Firebase, add: config/firebase-seller-service-account.json");
    }
    
    if (fs.existsSync(defaultFirebasePath)) {
      console.log("✅ Default Firebase service account found");
    } else {
      console.log("❌ Default Firebase service account NOT found");
      process.exit(1);
    }
    
    // Connect to database
    console.log("\n📊 Connecting to database...");
    await mongoose.connect(DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to database");

    // Find a shop with FCM token
    const shop = await Shop.findOne({ 
      expoPushToken: { $exists: true, $ne: null, $ne: '' } 
    }).select('name expoPushToken _id');

    if (!shop) {
      console.log("❌ No shop found with FCM token");
      console.log("Please add a shop with expoPushToken to test");
      process.exit(1);
    }

    console.log("\n📱 Shop found:");
    console.log(`   Name: ${shop.name}`);
    console.log(`   ID: ${shop._id}`);
    console.log(`   Has Token: ${!!shop.expoPushToken}`);

    // Find a recent order for this shop
    const order = await Order.findOne({ shop: shop._id })
      .sort({ createdAt: -1 })
      .populate('shop', 'name address phone');

    if (!order) {
      console.log("\n❌ No orders found for this shop");
      console.log("Please create an order first to test");
      process.exit(1);
    }

    console.log("\n📦 Order found:");
    console.log(`   Order ID: ${order._id}`);
    console.log(`   Order Number: #${order._id.toString().slice(-6).toUpperCase()}`);
    console.log(`   Total Price: ₹${order.totalPrice}`);
    console.log(`   Items: ${order.cart ? order.cart.length : 0}`);

    // Send test notification
    console.log("\n🔔 Sending test notification to seller...");
    const result = await sendFCMNotificationToSeller(shop, order);

    if (result.success) {
      console.log("\n✅ Notification sent successfully!");
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`   Firebase Instance: ${result.firebaseInstance || 'default'}`);
      console.log(`   FCM Token: ${result.fcmToken.substring(0, 20)}...`);
    } else {
      console.log("\n❌ Failed to send notification");
      console.log(`   Error: ${result.error}`);
    }

    // Close database connection
    await mongoose.connection.close();
    console.log("\n✅ Test completed");
    process.exit(0);

  } catch (error) {
    console.error("\n❌ Error during test:", error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the test
testSellerNotification();
