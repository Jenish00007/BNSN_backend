const Notification = require("../model/notification");
const Conversation = require("../model/conversation");
const User = require("../model/user");
const Shop = require("../model/shop");
const { sendPushNotification } = require("./pushNotification");
const { sendSmartPushNotification } = require("./fcmPushNotification");

// Helper function to create notifications
const createNotification = async (userId, title, description, type = "general", data = {}, orderId = null, shopId = null) => {
  try {
    const notification = await Notification.create({
      user: userId,
      title,
      description,
      type,
      data,
      orderId,
      shopId,
    });
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

// Helper function to create chat notifications and send push notifications
const createChatNotification = async (conversationId, senderId, messageText) => {
  try {
    // Get conversation details to find the recipient
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Find the recipient (the other person in the conversation)
    const recipientId = conversation.members.find(member => member.toString() !== senderId.toString());
    if (!recipientId) {
      throw new Error("Recipient not found");
    }

    // Get recipient details to check if they have push token
    let recipient = null;
    let recipientType = null;

    // Try User collection first (buyer)
    recipient = await User.findById(recipientId);
    if (recipient) {
      recipientType = 'user';
    } else {
      // Try Shop collection (seller)
      recipient = await Shop.findById(recipientId);
      if (recipient) {
        recipientType = 'shop';
      }
    }

    if (!recipient) {
      console.log("Recipient not found in User or Shop collections");
      return null;
    }

    // Get sender details for notification
    let sender = null;
    let senderType = null;

    // Try User collection first
    sender = await User.findById(senderId);
    if (sender) {
      senderType = 'user';
    } else {
      // Try Shop collection
      sender = await Shop.findById(senderId);
      if (sender) {
        senderType = 'shop';
      }
    }

    if (!sender) {
      console.log("Sender not found in User or Shop collections");
      return null;
    }

    // Create notification title and description
    const senderName = sender.name || 'Someone';
    const title = `New message from ${senderName}`;
    const description = messageText.length > 50 ? messageText.substring(0, 50) + '...' : messageText;

    // Create notification in database
    const notification = await createNotification(
      recipientId,
      title,
      description,
      "chat",
      {
        conversationId: conversationId,
        senderId: senderId,
        senderName: senderName,
        senderType: senderType,
        messageText: messageText
      }
    );

    // Send push notification if recipient has push token
    if (recipient.pushToken) {
      try {
        const pushResult = await sendSmartPushNotification(
          recipient.pushToken,
          title,
          description,
          {
            type: "chat",
            conversationId: conversationId,
            senderId: senderId,
            senderName: senderName,
            notificationId: notification._id.toString()
          }
        );
        
        if (pushResult.success) {
          console.log("Chat push notification sent successfully via", 
            recipient.pushToken.includes(':APA91b') ? 'FCM' : 'Expo');
        } else {
          console.error("Push notification failed:", pushResult.error);
        }
      } catch (pushError) {
        console.error("Error sending chat push notification:", pushError);
        // Don't fail the whole process if push notification fails
      }
    } else {
      console.log("Recipient has no push token");
    }

    return notification;
  } catch (error) {
    console.error("Error creating chat notification:", error);
    throw error;
  }
};

// Helper function to create order-related notifications
const createOrderNotification = async (userId, orderId, title, description, data = {}) => {
  return await createNotification(userId, title, description, "order", data, orderId);
};

// Helper function to create offer/promotion notifications
const createOfferNotification = async (userId, title, description, data = {}, shopId = null) => {
  return await createNotification(userId, title, description, "offer", data, null, shopId);
};

// Helper function to create general notifications
const createGeneralNotification = async (userId, title, description, data = {}) => {
  return await createNotification(userId, title, description, "general", data);
};

// Helper function to create promotion notifications
const createPromotionNotification = async (userId, title, description, data = {}, shopId = null) => {
  return await createNotification(userId, title, description, "promotion", data, null, shopId);
};

module.exports = {
  createNotification,
  createChatNotification,
  createOrderNotification,
  createOfferNotification,
  createGeneralNotification,
  createPromotionNotification,
}; 