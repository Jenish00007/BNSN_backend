// Test FCM notification for Hemant
const { sendSmartPushNotification } = require('./utils/fcmPushNotification');

// Hemant's data
const hemantToken = "cTQZe-_8SjuUw84cwiLpd3:APA91bF29et9PH_kBjEhMXRMl1-fAooOsRxAASQymGaKRCMpUueKCcGDc0jyZDXJklqfwjlJbYMrIRzFV5NNrZYBIBCfYgSy13pYtxdXBUdnTCbY5eD5X3A";

async function testHemantNotification() {
  console.log('🧪 TESTING FCM NOTIFICATION FOR HEMANT');
  console.log('=' .repeat(50));

  try {
    console.log('\n📱 Token Info:');
    console.log('Token:', hemantToken.substring(0, 30) + '...');
    console.log('Length:', hemantToken.length);
    console.log('Type: FCM (Firebase)');

    console.log('\n🔔 Sending Test Notification...');
    
    const result = await sendSmartPushNotification(
      hemantToken,
      'Test Message',
      'This is a test notification from the BSNS app',
      {
        type: 'chat',
        conversationId: 'test-conversation-123',
        senderId: 'test-sender-456',
        senderName: 'Test Sender'
      }
    );

    console.log('\n📊 Result:');
    console.log('Success:', result.success ? '✅ YES' : '❌ NO');
    
    if (result.success) {
      console.log('Message ID:', result.messageId);
      console.log('🎉 NOTIFICATION SENT SUCCESSFULLY!');
      console.log('📱 Hemant should receive this notification on his device');
    } else {
      console.log('❌ Error:', result.error);
      console.log('❌ Code:', result.code || 'N/A');
      
      // Provide specific troubleshooting
      if (result.error.includes('Firebase not initialized')) {
        console.log('\n🔧 FIX NEEDED:');
        console.log('1. Check Firebase service account key exists');
        console.log('2. Verify Firebase credentials are valid');
        console.log('3. Ensure Firebase Admin SDK is properly configured');
      } else if (result.error.includes('registration-token-not-registered')) {
        console.log('\n🔧 FIX NEEDED:');
        console.log('1. Hemant needs to login again to refresh token');
        console.log('2. Token may have expired');
        console.log('3. App may have been reinstalled');
      } else if (result.error.includes('invalid-registration-token')) {
        console.log('\n🔧 FIX NEEDED:');
        console.log('1. Token format is invalid');
        console.log('2. Check token generation in frontend');
        console.log('3. User may need to login again');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testHemantNotification();
