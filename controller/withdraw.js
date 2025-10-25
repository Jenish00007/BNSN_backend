const Shop = require("../model/shop");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const express = require("express");
const { isSeller, isAuthenticated, isAdmin } = require("../middleware/auth");
const Withdraw = require("../model/withdraw");
const sendEmail = require("../config/email.config");
const Configuration = require("../model/Configuration");
const router = express.Router();

// Middleware to check if withdraw functionality should be enabled
const checkWithdrawEnabled = catchAsyncErrors(async (req, res, next) => {
  try {
    const configuration = await Configuration.findOne({ isActive: true });
    
    if (!configuration) {
      return next(new ErrorHandler("Configuration not found", 404));
    }
    
    // If app type is single vendor, disable withdraw functionality
    if (configuration.appType === 'singlevendor') {
      return res.status(403).json({
        success: false,
        message: 'Withdraw functionality is not available for single vendor apps'
      });
    }
    
    next();
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// create withdraw request --- only for seller
router.post(
  "/create-withdraw-request",
  checkWithdrawEnabled,
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { amount, bankName, bankAccountNumber, bankIfscCode } = req.body;

      const data = {
        seller: req.seller._id,
        amount,
        bankName,
        bankAccountNumber,
        bankIfscCode,
      };

      // Use Nodemailer-based sendEmail (to, subject, html)
      if (!req.seller.email) {
        console.error("No recipient email found for seller:", req.seller);
        // Optionally: return next(new ErrorHandler("No recipient email found", 400));
      } else {
        try {
          await sendEmail(
            req.seller.email,
            "Withdraw Request",
            `<p>Hello ${req.seller.name},</p><p>Your withdraw request of ₹${amount} is processing. It will take 3 to 7 days to process!</p>`
          );
        } catch (error) {
          return next(new ErrorHandler(error.message, 500));
        }
      }

      const withdraw = await Withdraw.create(data);

      const shop = await Shop.findById(req.seller._id);

      shop.availableBalance = shop.availableBalance - amount;

      await shop.save();

      res.status(201).json({
        success: true,
        withdraw,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// get all withdraws --- admin
router.get(
  "/get-all-withdraw-request",
  checkWithdrawEnabled,
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const withdraws = await Withdraw.find().sort({ createdAt: -1 }).populate("seller");

      res.status(201).json({
        success: true,
        withdraws,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// get seller withdraws --- seller
router.get(
  "/get-all-withdraw-request-seller",
  checkWithdrawEnabled,
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const withdrawals = await Withdraw.find({ seller: req.seller._id }).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        withdrawals,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update withdraw request ---- admin
router.put(
  "/update-withdraw-request/:id",
  checkWithdrawEnabled,
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { sellerId } = req.body;

      if (!sellerId) {
        return next(new ErrorHandler("Seller ID is required", 400));
      }

      const withdraw = await Withdraw.findById(req.params.id);
      
      if (!withdraw) {
        return next(new ErrorHandler("Withdrawal request not found", 404));
      }

      if (withdraw.status === "succeed") {
        return next(new ErrorHandler("This withdrawal request has already been processed", 400));
      }

      withdraw.status = "Succeed";
      withdraw.updatedAt = Date.now();
      withdraw.transactionId = `TRX${Date.now()}${Math.floor(Math.random() * 1000)}`;

      await withdraw.save();

      const shop = await Shop.findById(sellerId);
      
      if (!shop) {
        return next(new ErrorHandler("Seller not found", 404));
      }

      const transection = {
        _id: withdraw._id,
        amount: withdraw.amount,
        updatedAt: withdraw.updatedAt,
        status: withdraw.status,
      };

      shop.transections = [...shop.transections, transection];
      await shop.save();

      try {
        await sendEmail({
          email: shop.email,
          subject: "Withdraw Request Approved",
          message: `Hello ${shop.name}, Your withdraw request of ${withdraw.amount}$ has been approved. Transaction ID: ${withdraw.transactionId}`,
        });
      } catch (error) {
        console.error("Error sending email:", error);
        // Don't return error here, continue with the response
      }

      res.status(200).json({
        success: true,
        withdraw,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;
