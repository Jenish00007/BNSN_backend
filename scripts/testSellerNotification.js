/**
 * Test script for Seller Push Notifications
 * 
 * This script tests the seller notification functionality by:
 * 1. Finding a shop with a valid FCM token
 * 2. Creating a test order for that shop
 * 3. Sending a push notification to the seller
 * 
 * Usage:
 *   node scripts/testSellerNotification.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Shop = require('../model/shop');
const Order = require('../model/order');
const { sendFCMNotificationToSeller } = require('../utils/fcmService');

// Database connection
const connectDatabase = async () => {
  try {
    await mongoose.connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};

// Find a shop with valid FCM token
const findShopWithToken = async () => {
  try {
    const shop = await Shop.findOne({
      expoPushToken: { $exists: true, $ne: null, $ne: '' }
    }).select('_id name email expoPushToken');

    if (!shop) {
      console.log('❌ No shop found with FCM token');
      console.log('Please ensure at least one seller has logged into the Seller App');
      return null;
    }

    console.log('✅ Found shop with FCM token:');
    console.log('   - Name:', shop.name);
    console.log('   - Email:', shop.email);
    console.log('   - Token:', shop.expoPushToken.substring(0, 50) + '...');
    
    return shop;
  } catch (error) {
    console.error('❌ Error finding shop:', error);
    return null;
  }
};

// Create a test order
const createTestOrder = async (shopId) => {
  try {
    const testOrder = {
      cart: [
        {
          product: new mongoose.Types.ObjectId(),
          shopId: shopId,
          quantity: 2,
          price: 299,
          name: 'Test Product 1',
          images: ['https://example.com/image1.jpg']
        },
        {
          product: new mongoose.Types.ObjectId(),
          shopId: shopId,
          quantity: 1,
          price: 199,
          name: 'Test Product 2',
          images: ['https://example.com/image2.jpg']
        }
      ],
      shippingAddress: {
        address: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        zipCode: '123456',
        phoneNumber: '9876543210'
      },
      user: {
        _id: new mongoose.Types.ObjectId(),
        name: 'Test User',
        email: 'testuser@example.com',
        phoneNumber: '9876543210'
      },
      totalPrice: 797,
      paymentInfo: {
        status: 'pending',
        type: 'COD'
      },
      userLocation: {
        latitude: 28.6139,
        longitude: 77.2090
      },
      otp: '123456',
      shop: shopId
    };

    const order = await Order.create(testOrder);
    
    console.log('✅ Test order created:');
    console.log('   - Order ID:', order._id);
    console.log('   - Order Number:', order._id.toString().slice(-6).toUpperCase());
    console.log('   - Total Items:', order.cart.reduce((sum, item) => sum + item.quantity, 0));
    console.log('   - Total Price: ₹' + order.totalPrice);
    
    return order;
  } catch (error) {
    console.error('❌ Error creating test order:', error);
    return null;
  }
};

// Send notification to seller
const sendNotification = async (shop, order) => {
  try {
    console.log('\n📱 Sending push notification to seller...');
    
    const result = await sendFCMNotificationToSeller(shop, order);
    
    if (result.success) {
      console.log('✅ Notification sent successfully!');
      console.log('   - Message ID:', result.messageId);
      console.log('   - FCM Token:', result.fcmToken?.substring(0, 50) + '...');
    } else {
      console.log('❌ Notification failed:');
      console.log('   - Error:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error sending notification:', error);
    return { success: false, error: error.message };
  }
};

// Clean up test data
const cleanup = async (orderId) => {
  try {
    if (orderId) {
      await Order.findByIdAndDelete(orderId);
      console.log('✅ Test order cleaned up');
    }
  } catch (error) {
    console.error('⚠️  Error cleaning up test order:', error);
  }
};

// Main test function
const runTest = async () => {
  console.log('🧪 Starting Seller Notification Test\n');
  console.log('='.repeat(60));
  
  let order = null;
  
  try {
    // Connect to database
    await connectDatabase();
    
    // Find shop with token
    console.log('\n1️⃣  Finding shop with FCM token...');
    const shop = await findShopWithToken();
    if (!shop) {
      process.exit(1);
    }
    
    // Create test order
    console.log('\n2️⃣  Creating test order...');
    order = await createTestOrder(shop._id);
    if (!order) {
      process.exit(1);
    }
    
    // Send notification
    console.log('\n3️⃣  Sending notification...');
    const result = await sendNotification(shop, order);
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Summary:');
    console.log('   - Shop Found: ✅');
    console.log('   - Order Created: ✅');
    console.log('   - Notification:', result.success ? '✅ SUCCESS' : '❌ FAILED');
    
    if (result.success) {
      console.log('\n🎉 All tests passed!');
      console.log('Check the Seller App on the device to see the notification.');
    } else {
      console.log('\n⚠️  Notification failed. Check the error above.');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
  } finally {
    // Clean up
    console.log('\n4️⃣  Cleaning up...');
    if (order) {
      await cleanup(order._id);
    }
    
    // Close database connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    
    console.log('\n='.repeat(60));
    console.log('🏁 Test completed\n');
  }
};

// Run the test
runTest();

