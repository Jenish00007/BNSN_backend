const mongoose = require('mongoose');
const User = require('./model/user');
const Shop = require('./model/shop');
const Conversation = require('./model/conversation');
const Message = require('./model/messages');
const { createChatNotification } = require('./utils/notificationHelper');

// Your user data
const userData = {
  _id: "68ff82f0f76b6a48055b3f74",
  email: "hemantr128@gmail.com",
  name: "Hemant Rajput",
  pushToken: "cTQZe-_8SjuUw84cwiLpd3:APA91bF29et9PH_kBjEhMXRMl1-fAooOsRxAASQymGaKRCMpUueKCcGDc0jyZDXJklqfwjlJbYMrIRzFV5NNrZYBIBCfYgSy13pYtxdXBUdnTCbY5eD5X3A",
  role: "user"
};

async function testChatNotification() {
  try {
    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/bnsn', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to database');

    // Step 1: Find your user
    const user = await User.findById(userData._id);
    if (!user) {
      console.log('❌ User not found in database');
      return;
    }
    console.log('✅ User found:', user.name);
    console.log('📱 Push token:', user.pushToken ? 'Available' : 'Not available');

    // Step 2: Find or create a test conversation
    let conversation = await Conversation.findOne({
      members: { $in: [userData._id] }
    });

    if (!conversation) {
      // Find a shop to create conversation with
      const shop = await Shop.findOne();
      if (!shop) {
        console.log('❌ No shop found to create test conversation');
        return;
      }

      conversation = new Conversation({
        members: [userData._id, shop._id],
        buyerId: userData._id,
        sellerId: shop._id,
        groupTitle: `Chat with ${shop.name}`
      });
      await conversation.save();
      console.log('✅ Created test conversation with shop:', shop.name);
    } else {
      console.log('✅ Found existing conversation');
    }

    // Step 3: Create a test message
    const testMessage = new Message({
      conversationId: conversation._id,
      sender: conversation.members.find(id => id.toString() !== userData._id.toString()), // Send from other user
      text: "Test message for notification system"
    });
    await testMessage.save();
    console.log('✅ Created test message');

    // Step 4: Test notification creation
    console.log('🔔 Testing notification creation...');
    
    const senderId = conversation.members.find(id => id.toString() !== userData._id.toString());
    
    try {
      await createChatNotification(
        conversation._id.toString(),
        senderId.toString(),
        "Test message for notification system"
      );
      console.log('✅ Notification created successfully!');
      console.log('📱 Push notification should be sent to:', user.pushToken);
    } catch (notificationError) {
      console.log('❌ Notification failed:', notificationError.message);
    }

    // Step 5: Check notification in database
    const Notification = require('./model/notification');
    const notifications = await Notification.find({
      user: userData._id,
      type: 'chat'
    }).sort({ createdAt: -1 }).limit(1);
    
    if (notifications.length > 0) {
      const notif = notifications[0];
      console.log('✅ Notification found in database:');
      console.log('   Title:', notif.title);
      console.log('   Message:', notif.message);
      console.log('   Type:', notif.type);
      console.log('   Created:', notif.createdAt);
    } else {
      console.log('❌ No notification found in database');
    }

    console.log('\n🎯 Test Summary:');
    console.log('   User has push token:', !!user.pushToken);
    console.log('   Conversation exists:', !!conversation);
    console.log('   Message created:', !!testMessage);
    console.log('   Notification should work:', !!(user.pushToken && conversation));

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the test
testChatNotification();
