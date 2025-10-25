const Notification = require("../model/notification");

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
  createOrderNotification,
  createOfferNotification,
  createGeneralNotification,
  createPromotionNotification,
}; 