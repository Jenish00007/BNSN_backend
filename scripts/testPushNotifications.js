const mongoose = require('mongoose');
const { sendPushNotification, sendOrderStatusNotification } = require('../utils/pushNotification');
require('dotenv').config({ path: '../config/.env' });

// Connect to database
const connectDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Test push notification
const testPushNotification = async () => {
  try {
    console.log('Testing push notification...');
    
    // Replace with a valid Expo push token for testing
    const testToken = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]'; // Replace with actual token
    
    const result = await sendPushNotification(
      testToken,
      'Test Notification',
      'This is a test notification from the backend',
      {
        type: 'test',
        timestamp: new Date().toISOString()
      }
    );
    
    console.log('Push notification result:', result);
    
    if (result.success) {
      console.log('✅ Push notification test successful!');
    } else {
      console.log('❌ Push notification test failed:', result.error);
    }
    
  } catch (error) {
    console.error('Error testing push notification:', error);
  }
};

// Test order status notification
const testOrderStatusNotification = async () => {
  try {
    console.log('Testing order status notification...');
    
    // Replace with a valid Expo push token for testing
    const testToken = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]'; // Replace with actual token
    
    const result = await sendOrderStatusNotification(
      testToken,
      'ORD-12345',
      'Processing',
      'Test Shop'
    );
    
    console.log('Order status notification result:', result);
    
    if (result.success) {
      console.log('✅ Order status notification test successful!');
    } else {
      console.log('❌ Order status notification test failed:', result.error);
    }
    
  } catch (error) {
    console.error('Error testing order status notification:', error);
  }
};

// Main test function
const runTests = async () => {
  console.log('🚀 Starting push notification tests...\n');
  
  await connectDatabase();
  
  console.log('\n📱 Testing basic push notification...');
  await testPushNotification();
  
  console.log('\n📦 Testing order status notification...');
  await testOrderStatusNotification();
  
  console.log('\n✅ All tests completed!');
  
  // Close database connection
  await mongoose.connection.close();
  console.log('Database connection closed');
  
  process.exit(0);
};

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

// Run tests
runTests(); 