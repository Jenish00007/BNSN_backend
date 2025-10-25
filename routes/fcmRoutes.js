const express = require("express");
const router = express.Router();
const { sendFCMNotification, sendFCMNotificationToMultiple } = require("../utils/fcmService");
const { sendNewOrderNotificationToDeliverymen } = require("../utils/pushNotification");
const Order = require("../model/order");

// ✅ POST API to send notification
router.post("/send", async (req, res) => {
  try {
    const { fcmToken, title, body, data } = req.body;

    const result = await sendFCMNotification(fcmToken, title, body, data);

    if (result.success) {
      return res.status(200).json({
        success: true,
        messageId: result.messageId,
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("❌ Error sending notification:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ✅ POST API to send notification to multiple devices
router.post("/send-multiple", async (req, res) => {
  try {
    const { fcmTokens, title, body, data } = req.body;

    const result = await sendFCMNotificationToMultiple(fcmTokens, title, body, data);

    if (result.success) {
      return res.status(200).json({
        success: true,
        successCount: result.successCount,
        failureCount: result.failureCount,
        totalSent: result.totalSent,
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("❌ Error sending multiple notifications:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ✅ POST API to test new order notification to deliverymen
router.post("/test-new-order-notification", async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: "orderId is required",
      });
    }

    // Find the order
    const order = await Order.findById(orderId)
      .populate({
        path: 'cart.shopId',
        select: 'name address phone'
      })
      .populate('shop', 'name address phone')
      .populate('user', 'name phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    console.log(`Testing new order notification for order: ${orderId}`);
    const result = await sendNewOrderNotificationToDeliverymen(order);

    return res.status(200).json({
      success: true,
      message: "Notification test completed",
      result: result,
      orderDetails: {
        orderId: order._id,
        shopName: order.shop?.name || order.cart[0]?.shopId?.name || 'Unknown',
        totalPrice: order.totalPrice,
        totalItems: order.cart.reduce((total, item) => total + item.quantity, 0)
      }
    });
  } catch (error) {
    console.error("❌ Error testing new order notification:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
