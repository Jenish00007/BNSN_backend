const Notification = require("../model/notification");
const User = require("../model/user");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const express = require("express");
const { isAuthenticated, isAdmin } = require("../middleware/auth");
const { 
  sendPushNotification, 
  sendBulkPushNotifications,
  sendOrderStatusNotification,
  sendPromotionalNotification,
  sendDeliveryNotification 
} = require("../utils/pushNotification");
const router = express.Router();

// Get all notifications for a user
router.get(
  "/notifications",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const notifications = await Notification.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("orderId", "orderNumber status")
        .populate("shopId", "name avatar");

      const total = await Notification.countDocuments({ user: req.user._id });
      const unreadCount = await Notification.countDocuments({ 
        user: req.user._id, 
        isRead: false 
      });

      res.status(200).json({
        success: true,
        notifications,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalNotifications: total,
          unreadCount,
        },
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Mark notification as read
router.put(
  "/notifications/:id/read",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, user: req.user._id },
        { isRead: true },
        { new: true }
      );

      if (!notification) {
        return next(new ErrorHandler("Notification not found", 404));
      }

      res.status(200).json({
        success: true,
        notification,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Mark all notifications as read
router.put(
  "/notifications/read-all",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      await Notification.updateMany(
        { user: req.user._id, isRead: false },
        { isRead: true }
      );

      res.status(200).json({
        success: true,
        message: "All notifications marked as read",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Delete a notification
router.delete(
  "/notifications/:id",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const notification = await Notification.findOneAndDelete({
        _id: req.params.id,
        user: req.user._id,
      });

      if (!notification) {
        return next(new ErrorHandler("Notification not found", 404));
      }

      res.status(200).json({
        success: true,
        message: "Notification deleted successfully",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Delete all notifications
router.delete(
  "/notifications",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      await Notification.deleteMany({ user: req.user._id });

      res.status(200).json({
        success: true,
        message: "All notifications deleted successfully",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Get unread notification count
router.get(
  "/notifications/unread-count",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const unreadCount = await Notification.countDocuments({
        user: req.user._id,
        isRead: false,
      });

      res.status(200).json({
        success: true,
        unreadCount,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Create notification with push notification (for internal use - admin/shop)
router.post(
  "/create-notification",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { userId, title, description, type, data, orderId, shopId, sendPush = true } = req.body;

      if (!userId || !title || !description) {
        return next(new ErrorHandler("Missing required fields", 400));
      }

      const notification = await Notification.create({
        user: userId,
        title,
        description,
        type: type || "general",
        data: data || {},
        orderId,
        shopId,
      });

      // Send push notification if requested
      if (sendPush) {
        try {
          const user = await User.findById(userId);
          if (user && user.pushToken) {
            await sendPushNotification(
              user.pushToken,
              title,
              description,
              {
                notificationId: notification._id,
                type: type || "general",
                ...data
              }
            );
          }
        } catch (pushError) {
          console.error('Error sending push notification:', pushError);
          // Don't fail the request if push notification fails
        }
      }

      res.status(201).json({
        success: true,
        notification,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Send push notification to specific user (admin only)
router.post(
  "/send-push-notification",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { userId, title, body, data } = req.body;

      if (!userId || !title || !body) {
        return next(new ErrorHandler("Missing required fields", 400));
      }

      const user = await User.findById(userId);
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      if (!user.pushToken) {
        return next(new ErrorHandler("User has no push token", 400));
      }

      const result = await sendPushNotification(user.pushToken, title, body, data);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: "Push notification sent successfully",
          result
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Failed to send push notification",
          error: result.error
        });
      }
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Send bulk push notifications (admin only)
router.post(
  "/send-bulk-push-notifications",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { title, body, data, userIds } = req.body;

      if (!title || !body || !userIds || !Array.isArray(userIds)) {
        return next(new ErrorHandler("Missing required fields", 400));
      }

      // Get users with push tokens
      const users = await User.find({
        _id: { $in: userIds },
        pushToken: { $exists: true, $ne: null }
      });

      const pushTokens = users.map(user => user.pushToken);

      if (pushTokens.length === 0) {
        return next(new ErrorHandler("No users with push tokens found", 400));
      }

      const result = await sendBulkPushNotifications(pushTokens, title, body, data);

      res.status(200).json({
        success: true,
        message: "Bulk push notifications sent",
        result
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Send order status notification
router.post(
  "/send-order-status-notification",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { userId, orderNumber, status, shopName } = req.body;

      if (!userId || !orderNumber || !status || !shopName) {
        return next(new ErrorHandler("Missing required fields", 400));
      }

      const user = await User.findById(userId);
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      if (!user.pushToken) {
        return next(new ErrorHandler("User has no push token", 400));
      }

      const result = await sendOrderStatusNotification(user.pushToken, orderNumber, status, shopName);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: "Order status notification sent successfully",
          result
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Failed to send order status notification",
          error: result.error
        });
      }
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Send promotional notification
router.post(
  "/send-promotional-notification",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { userId, title, message, data } = req.body;

      if (!userId || !title || !message) {
        return next(new ErrorHandler("Missing required fields", 400));
      }

      const user = await User.findById(userId);
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      if (!user.pushToken) {
        return next(new ErrorHandler("User has no push token", 400));
      }

      const result = await sendPromotionalNotification(user.pushToken, title, message, data);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: "Promotional notification sent successfully",
          result
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Failed to send promotional notification",
          error: result.error
        });
      }
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Send delivery notification
router.post(
  "/send-delivery-notification",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { userId, orderNumber, deliveryManName, estimatedTime } = req.body;

      if (!userId || !orderNumber || !deliveryManName || !estimatedTime) {
        return next(new ErrorHandler("Missing required fields", 400));
      }

      const user = await User.findById(userId);
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      if (!user.pushToken) {
        return next(new ErrorHandler("User has no push token", 400));
      }

      const result = await sendDeliveryNotification(user.pushToken, orderNumber, deliveryManName, estimatedTime);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: "Delivery notification sent successfully",
          result
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Failed to send delivery notification",
          error: result.error
        });
      }
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router; 