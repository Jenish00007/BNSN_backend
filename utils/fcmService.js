const admin = require("firebase-admin");

// Initialize Firebase Admin for Deliverymen if not already initialized
if (!admin.apps.length) {
  const serviceAccount = require("../config/firebase-service-account.json");

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Use the same Firebase instance for sellers as for other notifications
const adminSeller = admin;

/**
 * Send HIGH-PRIORITY FCM notification to a single device (AGGRESSIVE MODE)
 * @param {string} fcmToken - The FCM token of the target device
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Optional data payload
 * @returns {Promise<object>} - Result object with success status and details
 */
const sendFCMNotification = async (fcmToken, title, body, data = {}) => {
  try {
    if (!fcmToken || !title || !body) {
      return {
        success: false,
        error: "fcmToken, title, and body are required",
      };
    }

    const message = {
      token: fcmToken,

      // Notification payload - System notification
      notification: {
        title,
        body,
      },

      // ANDROID HIGH-PRIORITY CONFIGURATION
      android: {
        priority: "high",
        ttl: 3600000, // 1 hour
        notification: {
          title,
          body,
          sound: "alarm", // Must exist in res/raw/alarm.mp3
          channelId: "order_alert_channel", // High-priority channel
          vibrateTimingsMillis: [0, 1000, 500, 1000, 500, 1000],
          lightSettings: {
            color: "#FF6B00", // Orange color for orders
            lightOnDurationMillis: 1000,
            lightOffDurationMillis: 500,
          },
          visibility: "public",
          sticky: true,
          notificationCount: 1,
        },
        directBootOk: true,
      },

      // iOS HIGH-PRIORITY CONFIGURATION
      apns: {
        headers: {
          "apns-priority": "10", // Highest priority (immediate delivery)
          "apns-push-type": "alert",
        },
        payload: {
          aps: {
            alert: {
              title,
              body,
            },
            // Critical alert (bypasses Do Not Disturb)
            sound: {
              critical: 1,
              name: "alarm_sound.caf",
              volume: 1.0,
            },
            badge: 1,
            contentAvailable: 1, // Wake app in background
            interruptionLevel: "critical", // iOS 15+
          },
        },
      },

      // DATA PAYLOAD - Custom data for app handling
      data: {
        ...data,
        timestamp: new Date().toISOString(),
        priority: "high",
        wake_device: "true",
        shouldPlaySound: "true",
      },

      // FCM options
      fcmOptions: {
        analyticsLabel: "deliveryman_order_alert",
      },
    };

    const response = await admin.messaging().send(message);

    return {
      success: true,
      messageId: response,
      fcmToken: fcmToken,
    };
  } catch (error) {
    console.error("Error sending FCM notification:", error);

    // Handle specific Firebase errors
    let errorMessage = error.message;
    if (error.code === "app/invalid-credential") {
      errorMessage =
        "Firebase credentials are invalid. Please check your service account configuration.";
    } else if (error.code === "messaging/invalid-registration-token") {
      errorMessage = "Invalid FCM token provided.";
    } else if (error.code === "messaging/registration-token-not-registered") {
      errorMessage = "FCM token is not registered or has been unregistered.";
    }

    return {
      success: false,
      error: errorMessage,
      fcmToken: fcmToken,
    };
  }
};

/**
 * Send HIGH-PRIORITY FCM notifications to multiple devices
 * @param {Array} fcmTokens - Array of FCM tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Optional data payload
 * @returns {Promise<object>} - Result object with success status and details
 */
const sendFCMNotificationToMultiple = async (
  fcmTokens,
  title,
  body,
  data = {}
) => {
  try {
    if (!Array.isArray(fcmTokens) || fcmTokens.length === 0) {
      return {
        success: false,
        error: "fcmTokens array is required and must not be empty",
      };
    }

    if (!title || !body) {
      return {
        success: false,
        error: "title and body are required",
      };
    }

    // Create individual messages for each token with high-priority config
    const messages = fcmTokens.map((token) => ({
      token: token,
      notification: {
        title,
        body,
      },
      android: {
        priority: "high",
        ttl: 3600000,
        notification: {
          title,
          body,
          sound: "alarm",
          channelId: "order_alert_channel",
          vibrateTimingsMillis: [0, 1000, 500, 1000, 500, 1000],
          lightSettings: {
            color: "#FF6B00",
            lightOnDurationMillis: 1000,
            lightOffDurationMillis: 500,
          },
          visibility: "public",
          sticky: true,
          notificationCount: 1,
        },
        directBootOk: true,
      },
      apns: {
        headers: {
          "apns-priority": "10",
          "apns-push-type": "alert",
        },
        payload: {
          aps: {
            alert: { title, body },
            sound: {
              critical: 1,
              name: "alarm_sound.caf",
              volume: 1.0,
            },
            badge: 1,
            contentAvailable: 1,
            interruptionLevel: "critical",
          },
        },
      },
      data: {
        ...data,
        timestamp: new Date().toISOString(),
        priority: "high",
        wake_device: "true",
        shouldPlaySound: "true",
      },
      fcmOptions: {
        analyticsLabel: "deliveryman_order_alert_batch",
      },
    }));

    const response = await admin.messaging().sendAll(messages);

    const successCount = response.responses.filter((r) => r.success).length;
    const failureCount = response.responses.length - successCount;

    return {
      success: true,
      successCount: successCount,
      failureCount: failureCount,
      responses: response.responses,
      totalSent: fcmTokens.length,
    };
  } catch (error) {
    console.error(
      "Error sending FCM notifications to multiple devices:",
      error
    );

    let errorMessage = error.message;
    if (error.code === "app/invalid-credential") {
      errorMessage =
        "Firebase credentials are invalid. Please check your service account configuration.";
    }

    return {
      success: false,
      error: errorMessage,
      totalSent: fcmTokens.length,
    };
  }
};

/**
 * Send HIGH-PRIORITY FCM notification to deliverymen for new orders (AGGRESSIVE ALERT)
 * @param {Array} deliverymen - Array of deliveryman objects with expoPushToken
 * @param {object} order - Order object with details
 * @returns {Promise<object>} - Result object with success status and details
 */
const sendFCMNotificationToDeliverymen = async (deliverymen, order) => {
  try {
    if (!Array.isArray(deliverymen) || deliverymen.length === 0) {
      return {
        success: false,
        error: "No deliverymen provided",
      };
    }

    // Filter deliverymen with valid FCM tokens
    const validDeliverymen = deliverymen.filter(
      (dm) =>
        dm.expoPushToken &&
        dm.expoPushToken.trim() !== "" &&
        dm.expoPushToken !== null
    );

    if (validDeliverymen.length === 0) {
      return {
        success: false,
        error: "No deliverymen with valid FCM tokens found",
      };
    }

    // Create notification content
    const orderNumber = order._id.toString().slice(-6).toUpperCase();

    // Try to get shop name
    let shopName = "Qauds";
    if (order.shop && order.shop.name) {
      shopName = order.shop.name;
    } else if (
      order.cart &&
      order.cart.length > 0 &&
      order.cart[0].shopId &&
      order.cart[0].shopId.name
    ) {
      shopName = order.cart[0].shopId.name;
    }

    const totalItems = order.cart
      ? order.cart.reduce((total, item) => total + item.quantity, 0)
      : 0;

    // AGGRESSIVE NOTIFICATION TITLES
    const title = `🔔 NEW ORDER ALERT - #${orderNumber}`;
    const body = `URGENT: Order from ${shopName} - ${totalItems} items - ₹${order.totalPrice}`;

    // Prepare data payload with high-priority flags
    const data = {
      orderId: order._id.toString(),
      orderNumber: orderNumber,
      shopName: shopName,
      totalItems: totalItems.toString(),
      totalPrice: order.totalPrice.toString(),
      type: "NEW_ORDER_ALERT",
      alert_level: "high",
      mode: "deliveryman_assignment",
    };

    console.log("\n🚨 ========================================");
    console.log(`   SENDING HIGH-PRIORITY ORDER ALERT`);
    console.log("========================================\n");
    console.log(`📦 Order: #${orderNumber}`);
    console.log(`🏪 Shop: ${shopName}`);
    console.log(`📱 Targeting: ${validDeliverymen.length} deliverymen`);
    console.log("========================================\n");

    // Send notifications to each deliveryman individually
    const results = [];
    for (const deliveryman of validDeliverymen) {
      console.log(
        `📤 Sending to: ${deliveryman.name} (ID: ${deliveryman._id})`
      );
      try {
        const result = await sendFCMNotification(
          deliveryman.expoPushToken,
          title,
          body,
          data
        );

        results.push({
          deliverymanId: deliveryman._id,
          deliverymanName: deliveryman.name,
          success: result.success,
          messageId: result.messageId,
          error: result.error,
        });

        if (result.success) {
          console.log(
            `✅ SUCCESS: ${deliveryman.name} - Message ID: ${result.messageId}`
          );
        } else {
          console.error(`❌ FAILED: ${deliveryman.name} - ${result.error}`);
        }
      } catch (error) {
        console.error(`💥 ERROR: ${deliveryman.name} - ${error.message}`);
        results.push({
          deliverymanId: deliveryman._id,
          deliverymanName: deliveryman.name,
          success: false,
          error: error.message,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;

    console.log("\n========================================");
    console.log(`📊 RESULTS: ${successCount}/${results.length} successful`);
    console.log("========================================\n");

    console.log("⚡ Expected Behavior:");
    console.log("   ✅ Device screen wakes (even if locked)");
    console.log("   ✅ Notification on lockscreen");
    console.log("   ✅ Alarm sound plays (aggressive)");
    console.log("   ✅ Strong vibration pattern");
    console.log("   ✅ Overrides silent mode");
    console.log("   ✅ Works in kill mode (app closed)\n");

    return {
      success: true,
      totalSent: validDeliverymen.length,
      successCount: successCount,
      failureCount: results.length - successCount,
      results: results,
    };
  } catch (error) {
    console.error(
      "\n❌ Error sending FCM notifications to deliverymen:",
      error
    );
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send HIGH-PRIORITY FCM notification to seller for new orders
 * @param {object} shop - Shop object with expoPushToken
 * @param {object} order - Order object with details
 * @returns {Promise<object>} - Result object with success status and details
 */
const sendFCMNotificationToSeller = async (shop, order) => {
  try {
    if (!shop || !shop.expoPushToken) {
      return {
        success: false,
        error: "Shop does not have a valid FCM token",
      };
    }

    // Create notification content
    const orderNumber = order._id.toString().slice(-6).toUpperCase();

    const totalItems = order.cart
      ? order.cart.reduce((total, item) => total + item.quantity, 0)
      : 0;

    const title = `🔔 NEW ORDER - #${orderNumber}`;
    const body = `New order with ${totalItems} items - ₹${order.totalPrice}`;

    // Prepare data payload
    const data = {
      orderId: order._id.toString(),
      orderNumber: orderNumber,
      totalItems: totalItems.toString(),
      totalPrice: order.totalPrice.toString(),
      type: "NEW_ORDER_SELLER",
      alert_level: "high",
    };

    console.log(`\n📤 Sending FCM notification to seller: ${shop.name}`);

    // HIGH-PRIORITY MESSAGE FOR SELLER
    const message = {
      token: shop.expoPushToken,
      notification: {
        title,
        body,
      },
      android: {
        priority: "high",
        ttl: 3600000,
        notification: {
          title,
          body,
          sound: "alarm",
          channelId: "seller_order_channel",
          vibrateTimingsMillis: [0, 1000, 500, 1000, 500, 1000],
          lightSettings: {
            color: "#00FF00",
            lightOnDurationMillis: 1000,
            lightOffDurationMillis: 500,
          },
          visibility: "public",
          sticky: true,
          notificationCount: 1,
        },
        directBootOk: true,
      },
      apns: {
        headers: {
          "apns-priority": "10",
          "apns-push-type": "alert",
        },
        payload: {
          aps: {
            alert: { title, body },
            sound: {
              critical: 1,
              name: "alarm_sound.caf",
              volume: 1.0,
            },
            badge: 1,
            contentAvailable: 1,
            interruptionLevel: "critical",
          },
        },
      },
      data: {
        ...data,
        timestamp: new Date().toISOString(),
        priority: "high",
        wake_device: "true",
        shouldPlaySound: "true",
      },
      fcmOptions: {
        analyticsLabel: "seller_order_alert",
      },
    };

    const response = await adminSeller.messaging().send(message);

    console.log(
      `✅ FCM notification sent successfully to seller: ${shop.name}`
    );

    return {
      success: true,
      messageId: response,
      fcmToken: shop.expoPushToken,
      firebaseInstance: adminSeller.name || "default",
    };
  } catch (error) {
    console.error("❌ Error sending FCM notification to seller:", error);

    let errorMessage = error.message;
    if (error.code === "app/invalid-credential") {
      errorMessage =
        "Firebase credentials are invalid for seller app. Please check your service account configuration.";
    } else if (error.code === "messaging/invalid-registration-token") {
      errorMessage = "Invalid FCM token provided for seller.";
    } else if (error.code === "messaging/registration-token-not-registered") {
      errorMessage =
        "Seller FCM token is not registered or has been unregistered.";
    }

    return {
      success: false,
      error: errorMessage,
      fcmToken: shop.expoPushToken,
    };
  }
};

module.exports = {
  sendFCMNotification,
  sendFCMNotificationToMultiple,
  sendFCMNotificationToDeliverymen,
  sendFCMNotificationToSeller,
};
