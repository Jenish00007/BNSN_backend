// Firebase FCM Push Notification Service
// This will replace Expo push notifications for FCM tokens

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
let firebaseInitialized = false;

const initializeFirebase = () => {
  if (!firebaseInitialized) {
    try {
      // Check if we have the service account key
      const serviceAccountPath = path.join(__dirname, '../config/firebase-service-account.json');
      
      if (require('fs').existsSync(serviceAccountPath)) {
        const serviceAccount = require(serviceAccountPath);
        
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id
        });
        
        firebaseInitialized = true;
        console.log('✅ Firebase Admin SDK initialized successfully');
      } else {
        console.log('❌ Firebase service account key not found at:', serviceAccountPath);
      }
    } catch (error) {
      console.error('❌ Error initializing Firebase:', error.message);
    }
  }
  return firebaseInitialized;
};

/**
 * Send push notification using Firebase FCM
 * @param {string} fcmToken - Firebase Cloud Messaging token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data to send with notification
 * @returns {Promise<object>} - Result of the push notification
 */
const sendFCMPushNotification = async (fcmToken, title, body, data = {}) => {
  try {
    // Initialize Firebase if not already done
    if (!initializeFirebase()) {
      return {
        success: false,
        error: 'Firebase not initialized'
      };
    }

    // Validate FCM token format
    if (!fcmToken || typeof fcmToken !== 'string') {
      return {
        success: false,
        error: 'Invalid FCM token'
      };
    }

    // Create the message
    const message = {
      token: fcmToken,
      notification: {
        title: title,
        body: body
      },
      data: {
        type: data.type || 'general',
        ...data
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    // Send the message
    const response = await admin.messaging().send(message);
    
    console.log(`✅ FCM notification sent successfully to ${fcmToken.substring(0, 20)}...`);
    console.log(`Message ID: ${response}`);
    
    return {
      success: true,
      messageId: response
    };

  } catch (error) {
    console.error('❌ Error sending FCM notification:', error.message);
    
    // Handle specific FCM errors
    let errorMessage = error.message;
    if (error.code === 'messaging/registration-token-not-registered') {
      errorMessage = 'Token is no longer registered - user needs to login again';
    } else if (error.code === 'messaging/invalid-registration-token') {
      errorMessage = 'Invalid registration token';
    } else if (error.code === 'messaging/unavailable') {
      errorMessage = 'FCM service temporarily unavailable';
    }

    return {
      success: false,
      error: errorMessage,
      code: error.code
    };
  }
};

/**
 * Send bulk FCM notifications to multiple users
 * @param {Array<string>} fcmTokens - Array of Firebase Cloud Messaging tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data to send with notification
 * @returns {Promise<object>} - Result of the push notifications
 */
const sendBulkFCMNotifications = async (fcmTokens, title, body, data = {}) => {
  try {
    if (!initializeFirebase()) {
      return {
        success: false,
        error: 'Firebase not initialized'
      };
    }

    // Filter out invalid tokens
    const validTokens = fcmTokens.filter(token => token && typeof token === 'string' && token.length > 50);
    
    if (validTokens.length === 0) {
      return {
        success: false,
        error: 'No valid FCM tokens provided'
      };
    }

    // Create multicast message
    const message = {
      tokens: validTokens,
      notification: {
        title: title,
        body: body
      },
      data: {
        type: data.type || 'general',
        ...data
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    // Send the multicast message
    const response = await admin.messaging().sendMulticast(message);
    
    console.log(`✅ FCM multicast sent: ${response.successCount} successful, ${response.failureCount} failed`);
    
    // Log failures if any
    if (response.failureCount > 0) {
      const failures = response.responses
        .filter((resp, index) => !resp.success)
        .map((resp, index) => ({
          token: validTokens[index],
          error: resp.error
        }));
      
      console.log('Failed tokens:', failures);
    }

    return {
      success: true,
      totalSent: validTokens.length,
      successCount: response.successCount,
      failureCount: response.failureCount,
      failures: response.responses
        .filter((resp, index) => !resp.success)
        .map((resp, index) => ({
          token: validTokens[index],
          error: resp.error.message
        }))
    };

  } catch (error) {
    console.error('❌ Error sending bulk FCM notifications:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Detect token type and send appropriate notification
 * @param {string} pushToken - Push token (FCM or Expo)
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data
 * @returns {Promise<object>} - Result of the push notification
 */
const sendSmartPushNotification = async (pushToken, title, body, data = {}) => {
  try {
    if (!pushToken) {
      return {
        success: false,
        error: 'No push token provided'
      };
    }

    // Detect token type
    const isFCMToken = pushToken.includes(':APA91b') || pushToken.length > 100;
    const isExpoToken = pushToken.startsWith('ExponentPushToken[');

    console.log(`Token type detected: ${isFCMToken ? 'FCM' : isExpoToken ? 'Expo' : 'Unknown'}`);

    if (isFCMToken) {
      // Use Firebase FCM
      return await sendFCMPushNotification(pushToken, title, body, data);
    } else if (isExpoToken) {
      // Use Expo (fallback to existing system)
      const { sendPushNotification } = require('./pushNotification');
      return await sendPushNotification(pushToken, title, body, data);
    } else {
      return {
        success: false,
        error: 'Unknown push token format'
      };
    }
  } catch (error) {
    console.error('❌ Error in smart push notification:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  sendFCMPushNotification,
  sendBulkFCMNotifications,
  sendSmartPushNotification,
  initializeFirebase
};
