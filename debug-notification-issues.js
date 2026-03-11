// Diagnostic test for notification issues
// This will help identify why Hemant isn't receiving notifications

console.log('🔍 NOTIFICATION TROUBLESHOOTING FOR HEMANT');
console.log('=' .repeat(60));

// Hemant's user data
const hemantData = {
  _id: "68ff82f0f76b6a48055b3f74",
  email: "hemantr128@gmail.com",
  name: "Hemant Rajput",
  pushToken: "cTQZe-_8SjuUw84cwiLpd3:APA91bF29et9PH_kBjEhMXRMl1-fAooOsRxAASQymGaKRCMpUueKCcGDc0jyZDXJklqfwjlJbYMrIRzFV5NNrZYBIBCfYgSy13pYtxdXBUdnTCbY5eD5X3A"
};

console.log('\n📋 STEP 1: Verify User Data');
console.log('User ID:', hemantData._id);
console.log('Name:', hemantData.name);
console.log('Push Token:', hemantData.pushToken ? 'Present' : 'Missing');
console.log('Token Length:', hemantData.pushToken ? hemantData.pushToken.length : 0);

console.log('\n🔧 STEP 2: Check Common Issues');

// Issue 1: Token format
console.log('\n2.1 Token Format Check:');
const token = hemantData.pushToken;
if (token) {
  const isFCMToken = token.includes(':APA91b');
  const isValidLength = token.length > 50;
  const hasValidChars = /^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/.test(token);
  
  console.log('FCM Format:', isFCMToken ? '✅' : '❌');
  console.log('Valid Length:', isValidLength ? '✅' : '❌');
  console.log('Valid Characters:', hasValidChars ? '✅' : '❌');
  
  if (!isFCMToken || !isValidLength || !hasValidChars) {
    console.log('❌ ISSUE: Push token format is invalid');
  } else {
    console.log('✅ Token format looks good');
  }
}

// Issue 2: Token expiration
console.log('\n2.2 Token Expiration Check:');
console.log('⚠️  FCM tokens can expire after 2-3 months');
console.log('⚠️  Tokens become invalid if app is uninstalled/reinstalled');
console.log('⚠️  Tokens change when user clears app data');

// Issue 3: Firebase configuration
console.log('\n2.3 Firebase Configuration Check:');
console.log('❓ Is Firebase properly configured in backend?');
console.log('❓ Are Firebase credentials valid?');
console.log('❓ Is Firebase Admin SDK initialized?');

console.log('\n🔍 STEP 3: Backend Configuration Check');

// Check if notification helper exists
try {
  const fs = require('fs');
  const notificationHelperPath = './utils/notificationHelper.js';
  
  if (fs.existsSync(notificationHelperPath)) {
    console.log('✅ notificationHelper.js exists');
    
    const content = fs.readFileSync(notificationHelperPath, 'utf8');
    const hasCreateChatNotification = content.includes('createChatNotification');
    const hasSendPushNotification = content.includes('sendPushNotification');
    
    console.log('Has createChatNotification:', hasCreateChatNotification ? '✅' : '❌');
    console.log('Has sendPushNotification:', hasSendPushNotification ? '✅' : '❌');
  } else {
    console.log('❌ notificationHelper.js missing');
  }
} catch (error) {
  console.log('❌ Error checking notification helper:', error.message);
}

console.log('\n🔍 STEP 4: Firebase Credentials Check');
const firebaseConfigFiles = [
  './firebase-adminsdk.json',
  './serviceAccountKey.json',
  './firebase-credentials.json'
];

let firebaseConfigFound = false;
firebaseConfigFiles.forEach(file => {
  try {
    const fs = require('fs');
    if (fs.existsSync(file)) {
      console.log('✅ Firebase config found:', file);
      firebaseConfigFound = true;
    }
  } catch (error) {
    console.log('❌ Error checking', file, ':', error.message);
  }
});

if (!firebaseConfigFound) {
  console.log('❌ No Firebase configuration files found');
  console.log('💡 SOLUTION: Add Firebase Admin SDK credentials');
}

console.log('\n🔍 STEP 5: Environment Variables Check');
const requiredEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_DATABASE_URL'
];

requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  console.log(envVar + ':', value ? '✅ Set' : '❌ Missing');
});

console.log('\n🔍 STEP 6: Message Creation Check');
try {
  const fs = require('fs');
  const messageControllerPath = './controller/message.js';
  
  if (fs.existsSync(messageControllerPath)) {
    const content = fs.readFileSync(messageControllerPath, 'utf8');
    const hasNotificationImport = content.includes('createChatNotification');
    const hasNotificationCall = content.includes('createChatNotification(');
    
    console.log('Has notification import:', hasNotificationImport ? '✅' : '❌');
    console.log('Has notification call:', hasNotificationCall ? '✅' : '❌');
    
    if (!hasNotificationImport || !hasNotificationCall) {
      console.log('❌ ISSUE: Message creation not triggering notifications');
    }
  } else {
    console.log('❌ message.js controller missing');
  }
} catch (error) {
  console.log('❌ Error checking message controller:', error.message);
}

console.log('\n🔍 STEP 7: Database Connection Check');
console.log('❓ Is MongoDB running?');
console.log('❓ Can backend connect to database?');
console.log('❓ Are conversations and messages being saved?');

console.log('\n🔍 STEP 8: Frontend Check');
console.log('❓ Is app running on physical device (not emulator)?');
console.log('❓ Are notifications enabled in device settings?');
console.log('❓ Is app in foreground/background when testing?');

console.log('\n🎯 POSSIBLE ISSUES & SOLUTIONS:');

console.log('\n1. PUSH TOKEN EXPIRED:');
console.log('   SOLUTION: User needs to login again to refresh token');

console.log('\n2. FIREBASE NOT CONFIGURED:');
console.log('   SOLUTION: Set up Firebase Admin SDK in backend');

console.log('\n3. NOTIFICATIONS DISABLED:');
console.log('   SOLUTION: Enable notifications in device settings');

console.log('\n4. APP ON EMULATOR:');
console.log('   SOLUTION: Test on physical device');

console.log('\n5. BACKEND NOT RUNNING:');
console.log('   SOLUTION: Start backend server');

console.log('\n6. DATABASE NOT CONNECTED:');
console.log('   SOLUTION: Check MongoDB connection');

console.log('\n📋 DEBUGGING STEPS:');
console.log('1. Start backend server with debug logging');
console.log('2. Send a test message');
console.log('3. Check backend logs for notification attempts');
console.log('4. Check Firebase console for delivery status');
console.log('5. Check device notification settings');

console.log('\n🔧 QUICK TEST:');
console.log('Run: node test-firebase-connection.js');
console.log('This will test Firebase configuration and send a test notification');
