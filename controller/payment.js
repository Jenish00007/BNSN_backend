const express = require("express");
const axios = require("axios");
const router = express.Router();
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const razorpayConfig = require("../config/razorpay");
const Order = require("../model/order");
const ErrorHandler = require("../utils/ErrorHandler");
const { isDeliveryMan } = require("../middleware/auth");

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: razorpayConfig.key_id,
  key_secret: razorpayConfig.key_secret,
});

// Helper function to check for repeating digits
const hasRepeatingDigits = (number) => {
  const digits = number.toString().split('');
  for (let i = 0; i < digits.length - 1; i++) {
    if (digits[i] === digits[i + 1]) {
      return true;
    }
  }
  return false;
};

// Create payment link
router.post(
  "/process",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { amount, email, name, contact } = req.body;

      // Log the incoming request data
      console.log('Payment request data:', {
        amount,
        email,
        name,
        contact
      });

      // Input validation
      if (!amount || !email || !name || !contact) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: amount, email, name, and contact are required"
        });
      }

      // Validate amount is a positive number and within limits
      const amountInPaise = Math.round(amount * 100);
      if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Amount must be a positive number"
        });
      }

      if (amountInPaise < razorpayConfig.min_amount || amountInPaise > razorpayConfig.max_amount) {
        return res.status(400).json({
          success: false,
          message: `Amount must be between ₹${razorpayConfig.min_amount/100} and ₹${razorpayConfig.max_amount/100}`
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format"
        });
      }

      // Validate contact number (Indian phone numbers with additional checks)
      const contactRegex = /^[6-9]\d{9}$/;
      if (!contactRegex.test(contact)) {
        return res.status(400).json({
          success: false,
          message: "Invalid contact number format. Must be a 10-digit number starting with 6-9"
        });
      }

      // Check for repeating digits
      if (hasRepeatingDigits(contact)) {
        return res.status(400).json({
          success: false,
          message: "Contact number cannot contain repeating digits"
        });
      }

      const paymentData = {
        amount: amountInPaise,
        currency: razorpayConfig.currency,
        accept_partial: false,
        reference_id: "order_" + Date.now(),
        description: "Payment for your order",
        customer: {
          name: name,
          email: email,
          contact: contact
        },
        notify: {
          sms: true,
          email: true
        },
        reminder_enable: true,
        notes: {
          order_id: "order_" + Date.now()
        },
        callback_url: razorpayConfig.callback_url,
        callback_method: razorpayConfig.callback_method,
        expire_by: Math.floor(Date.now() / 1000) + razorpayConfig.payment_link_expiry
      };

      console.log('Creating Razorpay payment link with data:', {
        ...paymentData,
        key_id: razorpayConfig.key_id
      });

      try {
        const paymentLink = await razorpay.paymentLink.create(paymentData);
        console.log('', paymentLink);

        if (!paymentLink || !paymentLink.short_url) {
          throw new Error("Failed to generate payment link");
        }

        res.status(200).json({
          success: true,
          paymentLink: paymentLink.short_url
        });
      } catch (razorpayError) {
        console.error("Razorpay API Error:", {
          error: razorpayError,
          errorMessage: razorpayError.message,
          errorResponse: razorpayError.response?.data,
          errorStatus: razorpayError.response?.status
        });

        // Handle specific Razorpay API errors
        if (razorpayError.response?.data) {
          const errorData = razorpayError.response.data;
          let errorMessage = 'Payment processing failed';

          if (errorData.error?.description) {
            errorMessage = errorData.error.description;
          } else if (errorData.error?.message) {
            errorMessage = errorData.error.message;
          }

          return res.status(500).json({
            success: false,
            message: `Razorpay API Error: ${errorMessage}`,
            error: process.env.NODE_ENV === 'development' ? errorData : undefined
          });
        }

        // Handle other Razorpay errors
        return res.status(500).json({
          success: false,
          message: `Payment processing failed: ${razorpayError.message || 'Unknown error'}`,
          error: process.env.NODE_ENV === 'development' ? razorpayError : undefined
        });
      }
    } catch (error) {
      console.error("General Error:", {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status
      });

      res.status(500).json({
        success: false,
        message: error.message || "Failed to process payment",
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  })
);

// Verify payment
router.post(
  "/verify",
  catchAsyncErrors(async (req, res, next) => {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      res.status(200).json({
        success: true,
        message: "Payment verified successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Invalid signature",
      });
    }
  })
);

// Get Razorpay key
router.get(
  "/razorpayapikey",
  catchAsyncErrors(async (req, res, next) => {
    res.status(200).json({ keyId: razorpayConfig.key_id });
  })
);

// ========== DELIVERY MAN QR PAYMENT ENDPOINTS ==========

// Generate QR code for payment - for delivery man
router.post(
  "/generate-qr",
  isDeliveryMan,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { orderId } = req.body;
      const deliveryManId = req.deliveryMan._id.toString();

      // Input validation
      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: "Order ID is required"
        });
      }

      // Find the order
      const order = await Order.findById(orderId)
        .populate('user', 'name email phoneNumber')
        .populate('shop', 'name')
        .populate('deliveryMan', 'name');

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found"
        });
      }

      // Verify that the order is assigned to the requesting delivery man
      if (!order.deliveryMan || order.deliveryMan._id.toString() !== deliveryManId) {
        return res.status(403).json({
          success: false,
          message: "This order is not assigned to you"
        });
      }

      // Check if order is in correct status for payment
      if (order.status !== "Out for delivery") {
        return res.status(400).json({
          success: false,
          message: "Order must be 'Out for delivery' to generate QR code"
        });
      }

      // Check if payment is already completed
      if (order.paymentInfo && order.paymentInfo.status === "succeeded") {
        return res.status(400).json({
          success: false,
          message: "Payment already completed for this order"
        });
      }

      // Calculate amount in paise
      const amountInPaise = Math.round(order.totalPrice * 100);

      // Create QR code data for Razorpay
      const qrCodeData = {
        type: "upi_qr",
        usage: "single_use",
        fixed_amount: true,
        payment_amount: amountInPaise,
        description: `Payment for Order #${orderId.slice(-8)}`,
        close_by: Math.floor(Date.now() / 1000) + (20 * 60), // 20 minutes expiry
        notes: {
          order_id: orderId,
          delivery_man_id: deliveryManId,
          customer_name: order.user.name,
          shop_name: order.shop.name,
          generated_at: new Date().toISOString()
        }
      };

      console.log('Creating Razorpay QR code with data:', qrCodeData);

      // Create QR code using Razorpay SDK (recommended approach)
      const qrCode = await razorpay.qrCode.create(qrCodeData);
      
      if (!qrCode || !qrCode.image_url) {
        throw new Error("Failed to generate QR code");
      }

      console.log('QR code generated successfully:', qrCode.id);
      
      // Update order with QR code info
      await Order.findByIdAndUpdate(orderId, {
        $set: {
          'paymentInfo.qr_code_id': qrCode.id,
          'paymentInfo.qr_expires_at': new Date(Date.now() + (20 * 60 * 1000)), // 20 minutes
          'paymentInfo.qr_generated_at': new Date(),
          'paymentInfo.type': 'qr_code'
        }
      });

      res.status(200).json({
        success: true,
        message: "QR code generated successfully",
        data: {
          qr_code_id: qrCode.id,
          qr_image_url: qrCode.image_url,
          amount: order.totalPrice,
          currency: "INR",
          expires_at: new Date(Date.now() + (20 * 60 * 1000)),
          order_details: {
            order_id: orderId,
            customer_name: order.user.name,
            shop_name: order.shop.name,
            total_amount: order.totalPrice
          }
        }
      });
    } catch (error) {
      console.error("Error generating QR code:", error);
      
      // Handle Razorpay specific errors
      if (error.response?.data) {
        const errorData = error.response.data;
        return res.status(500).json({
          success: false,
          message: `Razorpay QR Error: ${errorData.error?.description || errorData.error?.message || 'Unknown error'}`,
          error: process.env.NODE_ENV === 'development' ? errorData : undefined
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || "Failed to generate QR code",
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  })
);

// Check payment status for an order
router.get(
  "/status/:orderId",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { orderId } = req.params;

      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: "Order ID is required"
        });
      }

      // Find the order
      const order = await Order.findById(orderId)
        .populate('user', 'name email')
        .populate('deliveryMan', 'name');

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found"
        });
      }

      let paymentStatus = {
        order_id: orderId,
        payment_status: order.paymentInfo?.status || "pending",
        amount: order.totalPrice,
        currency: "INR",
        qr_expired: false
      };
      // If QR code exists, check its status
      if (order.paymentInfo?.qr_code_id) {
        try {
          // Fetch QR code details from Razorpay
          const qrCode = await razorpay.qrCode.fetch(order.paymentInfo.qr_code_id);

          paymentStatus.qr_code_status = qrCode.status;
          paymentStatus.qr_code_id = qrCode.id;
          
          // Check if QR code is expired
          const expiresAt = order.paymentInfo.qr_expires_at;
          if (expiresAt && new Date() > new Date(expiresAt)) {
            paymentStatus.qr_expired = true;
          }

          // If QR code has payments, check their status
          if (qrCode.payments_amount_received > 0) {
            paymentStatus.payment_status = "succeeded";
            paymentStatus.amount_received = qrCode.payments_amount_received / 100; // Convert from paise
            
            // Update order payment status if not already updated
            if (order.paymentInfo?.status !== "succeeded") {
              await Order.findByIdAndUpdate(orderId, {
                $set: {
                  'paymentInfo.status': 'succeeded',
                  'paymentInfo.paid_at': new Date(),
                  'status': 'Delivered' // Update order status to delivered
                }
              });
              paymentStatus.order_status_updated = true;
            }
          }
        } catch (qrError) {
          console.error('Error fetching QR code details:', qrError);
          // If QR code fetch fails, return basic status
          paymentStatus.qr_fetch_error = true;
        }
      }

      res.status(200).json({
        success: true,
        data: paymentStatus
      });

    } catch (error) {
      console.error("Error checking payment status:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to check payment status",
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  })
);

// Confirm payment received (for delivery man to manually confirm)
router.put(
  "/confirm-payment/:orderId",
  isDeliveryMan,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { orderId } = req.params;
      const { paymentMethod, notes } = req.body;
      const deliveryManId = req.deliveryMan._id.toString();

      console.log('Manual payment confirmation for order:', orderId, 'by delivery man:', deliveryManId);

      // Input validation
      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: "Order ID is required"
        });
      }

      // Find the order
      const order = await Order.findById(orderId)
        .populate('user', 'name email phoneNumber')
        .populate('deliveryMan', 'name');

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found"
        });
      }

      // Verify that the order is assigned to the requesting delivery man
      if (!order.deliveryMan || order.deliveryMan._id.toString() !== deliveryManId) {
        return res.status(403).json({
          success: false,
          message: "This order is not assigned to you"
        });
      }

      // Check if payment is already confirmed
      if (order.paymentInfo && order.paymentInfo.status === "succeeded") {
        return res.status(400).json({
          success: false,
          message: "Payment already confirmed for this order"
        });
      }

      // Check if order is in correct status
      if (order.status !== "Out for delivery") {
        return res.status(400).json({
          success: false,
          message: "Order must be 'Out for delivery' to confirm payment"
        });
      }

      // Update order with payment confirmation
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        {
          $set: {
            'paymentInfo.status': 'succeeded',
            'paymentInfo.type': paymentMethod || 'manual_confirmation',
            'paymentInfo.confirmed_by': deliveryManId,
            'paymentInfo.confirmed_at': new Date(),
            'paymentInfo.confirmation_notes': notes || '',
            'status': 'Delivered',
            'deliveredAt': new Date()
          }
        },
        { new: true }
      );

      console.log('Payment confirmed successfully for order:', orderId);

      res.status(200).json({
        success: true,
        message: "Payment confirmed successfully",
        data: {
          order_id: orderId,
          payment_status: "succeeded",
          order_status: "Delivered",
          confirmed_at: new Date(),
          confirmed_by: deliveryManId
        }
      });

    } catch (error) {
      console.error("Error confirming payment:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to confirm payment",
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  })
);

// Razorpay webhook for QR code payment notifications
router.post(
  "/webhook/qr-payment",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const webhookBody = req.body;
      const webhookSignature = req.headers['x-razorpay-signature'];

      console.log('Received QR payment webhook:', webhookBody);

      // Verify webhook signature (important for security)
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET)
        .update(JSON.stringify(webhookBody))
        .digest('hex');

      if (webhookSignature !== expectedSignature) {
        console.log('Invalid webhook signature');
        return res.status(400).json({
          success: false,
          message: 'Invalid webhook signature'
        });
      }

      // Handle payment link events
      if (webhookBody.event === 'payment_link.paid') {
        const paymentLinkId = webhookBody.payload.payment_link.entity.id;
        const paymentAmount = webhookBody.payload.payment.entity.amount;
        const paymentId = webhookBody.payload.payment.entity.id;

        console.log('Payment link payment received:', {
          paymentLinkId,
          paymentAmount,
          paymentId
        });

        // Find the order with this payment link ID
        const order = await Order.findOne({
          'paymentInfo.qr_code_id': paymentLinkId
        }).populate('deliveryMan', 'name expoPushToken');

        if (order) {
          // Update order payment status
          await Order.findByIdAndUpdate(order._id, {
            $set: {
              'paymentInfo.status': 'succeeded',
              'paymentInfo.id': paymentId,
              'paymentInfo.paid_at': new Date(),
              'status': 'Delivered',
              'deliveredAt': new Date()
            }
          });

          console.log('Order payment status updated:', order._id);

          // Send push notification to delivery man if available
          if (order.deliveryMan && order.deliveryMan.expoPushToken) {
            try {
              const { sendPushNotification } = require('../utils/pushNotification');
              await sendPushNotification(
                order.deliveryMan.expoPushToken,
                'Payment Received!',
                `Payment of ₹${paymentAmount / 100} received for order #${order._id.toString().slice(-8)}`,
                { 
                  type: 'payment_received',
                  orderId: order._id.toString(),
                  amount: paymentAmount / 100
                }
              );
            } catch (pushError) {
              console.error('Failed to send push notification:', pushError);
            }
          }

          res.status(200).json({
            success: true,
            message: 'Webhook processed successfully'
          });
        } else {
          console.log('Order not found for payment link:', paymentLinkId);
          res.status(404).json({
            success: false,
            message: 'Order not found for payment link'
          });
        }
      } else {
        // Acknowledge other webhook events
        res.status(200).json({
          success: true,
          message: 'Webhook received'
        });
      }

    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({
        success: false,
        message: 'Webhook processing failed'
      });
    }
  })
);

module.exports = router;
