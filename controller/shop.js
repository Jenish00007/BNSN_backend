const express = require("express");
const path = require("path");
const router = express.Router();
const fs = require("fs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../config/email.config");
const Shop = require("../model/shop");
const { isAuthenticated, isSeller, isAdmin } = require("../middleware/auth");
const { upload } = require("../multer");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../utils/ErrorHandler");

const sendShopToken = require("../utils/shopToken");

// create shop
router.post("/create-shop", upload.single("shopAvatar"), async (req, res, next) => {
  try {
    const { email } = req.body;
    const sellerEmail = await Shop.findOne({ email });

    if (sellerEmail) {
      return next(new ErrorHandler("User already exists", 400));
    }

    // Check app type to conditionally include withdraw-related fields
    const Configuration = require("../model/Configuration");
    const configuration = await Configuration.findOne({ isActive: true });
    
    const seller = {
      name: req.body.name,
      email: email,
      password: req.body.password,
      avatar: req.file ? req.file.location : "https://your-default-avatar-url.com/default-avatar.jpg", // Use the S3 URL directly
      address: req.body.address,
      phoneNumber: req.body.phoneNumber,
      zipCode: req.body.zipCode,
      location: {
        type: 'Point',
        coordinates: [0, 0] // Default coordinates, can be updated later
      }
    };
    
    // Only include withdraw-related fields if app type is multivendor
    if (configuration && configuration.appType === 'multivendor') {
      seller.withdrawMethod = req.body.withdrawMethod || null;
    }

    // Create shop directly without activation
    const newSeller = await Shop.create(seller);
    sendShopToken(newSeller, 201, res);

  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// create activation token
const createActivationToken = (seller) => {
  return jwt.sign(seller, process.env.ACTIVATION_SECRET);
};

// activate user
router.post(
  "/activation",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { activation_token } = req.body;

      const newSeller = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET
      );

      if (!newSeller) {
        return next(new ErrorHandler("Invalid token", 400));
      }
      const { name, email, password, avatar, zipCode, address, phoneNumber } =
        newSeller;

      let seller = await Shop.findOne({ email });

      if (seller) {
        return next(new ErrorHandler("User already exists", 400));
      }

      seller = await Shop.create({
        name,
        email,
        avatar,
        password,
        zipCode,
        address,
        phoneNumber,
      });

      sendShopToken(seller, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// login shop
router.post(
  "/login-shop",
  catchAsyncErrors(async (req, res, next) => {
    try {
      console.log("Login request body:", req.body);
      const { email, password } = req.body;
      
      console.log("Login attempt with:", { 
        email: email || 'undefined', 
        password: password ? 'provided' : 'missing',
        bodyKeys: Object.keys(req.body)
      });

      if (!email) {
        return next(new ErrorHandler("Email is required!", 400));
      }

      if (!password) {
        return next(new ErrorHandler("Password is required!", 400));
      }

      const user = await Shop.findOne({ email }).select("+password");
      console.log("Found user:", user ? "Yes" : "No");

      if (!user) {
        return next(new ErrorHandler("User doesn't exists!", 400));
      }

      const isPasswordValid = await user.comparePassword(password);
      console.log("Password valid:", isPasswordValid);

      if (!isPasswordValid) {
        return next(
          new ErrorHandler("Please provide the correct information", 400)
        );
      }

      sendShopToken(user, 201, res);
    } catch (error) {
      console.error("Login error:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// load shop
router.get(
  "/getSeller",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const seller = await Shop.findById(req.seller._id);

      if (!seller) {
        return next(new ErrorHandler("User doesn't exists", 400));
      }

      // Check app type to conditionally hide withdraw-related fields
      const Configuration = require("../model/Configuration");
      const configuration = await Configuration.findOne({ isActive: true });
      
      let sellerData = seller.toObject();
      
      // If app type is single vendor, hide withdraw-related fields
      if (configuration && configuration.appType === 'singlevendor') {
        delete sellerData.withdrawMethod;
        delete sellerData.availableBalance;
        delete sellerData.transections;
      }

      res.status(200).json({
        success: true,
        seller: sellerData,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// log out from shop
router.get(
  "/logout",
  catchAsyncErrors(async (req, res, next) => {
    try {
      res.cookie("seller_token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
      });
      res.status(201).json({
        success: true,
        message: "Log out successful!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// get shop info
router.get(
  "/get-shop-info/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const shop = await Shop.findById(req.params.id);

      if (!shop) {
        return next(new ErrorHandler("Shop not found with this id", 404));
      }

      // Check app type to conditionally hide withdraw-related fields
      const Configuration = require("../model/Configuration");
      const configuration = await Configuration.findOne({ isActive: true });
      
      let shopData = shop.toObject();
      
      // If app type is single vendor, hide withdraw-related fields
      if (configuration && configuration.appType === 'singlevendor') {
        delete shopData.withdrawMethod;
        delete shopData.availableBalance;
        delete shopData.transections;
      }

      res.status(200).json({
        success: true,
        shop: shopData,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update shop profile picture
router.put(
  "/update-shop-avatar",
  isSeller,
  upload.single("image"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const existsUser = await Shop.findById(req.seller._id);

      // Only try to delete local file if it's not an S3 URL
      if (existsUser.avatar && !existsUser.avatar.startsWith('http')) {
        const existAvatarPath = `uploads/${existsUser.avatar}`;
        if (fs.existsSync(existAvatarPath)) {
          fs.unlinkSync(existAvatarPath);
        }
      }

      const fileUrl = req.file.location || path.join(req.file.filename);

      const seller = await Shop.findByIdAndUpdate(req.seller._id, {
        avatar: fileUrl,
      });

      res.status(200).json({
        success: true,
        seller,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update seller info
router.put(
  "/update-seller-info",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { name, description, address, phoneNumber, zipCode, businessHours } = req.body;

      const shop = await Shop.findById(req.seller._id);

      if (!shop) {
        return next(new ErrorHandler("User not found", 400));
      }

      shop.name = name;
      shop.description = description;
      shop.address = address;
      shop.phoneNumber = phoneNumber;
      shop.zipCode = zipCode;
      
      // Update business hours if provided
      if (businessHours) {
        shop.businessHours = businessHours;
      }

      await shop.save();

      res.status(201).json({
        success: true,
        shop,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// change password
router.put(
  "/change-password",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        return next(new ErrorHandler("Please provide old and new password", 400));
      }

      if (newPassword.length < 6) {
        return next(new ErrorHandler("Password should be at least 6 characters", 400));
      }

      const seller = await Shop.findById(req.seller._id).select("+password");

      if (!seller) {
        return next(new ErrorHandler("User not found", 400));
      }

      const isPasswordValid = await seller.comparePassword(oldPassword);

      if (!isPasswordValid) {
        return next(new ErrorHandler("Old password is incorrect", 400));
      }

      seller.password = newPassword;
      await seller.save();

      res.status(200).json({
        success: true,
        message: "Password updated successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// all sellers --- for admin
router.get(
  "/admin-all-sellers",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const sellers = await Shop.find().sort({
        createdAt: -1,
      });
      
      // Check app type to conditionally hide withdraw-related fields
      const Configuration = require("../model/Configuration");
      const configuration = await Configuration.findOne({ isActive: true });
      
      let sellersData = sellers.map(seller => {
        let sellerData = seller.toObject();
        
        // If app type is single vendor, hide withdraw-related fields
        if (configuration && configuration.appType === 'singlevendor') {
          delete sellerData.withdrawMethod;
          delete sellerData.availableBalance;
          delete sellerData.transections;
        }
        
        return sellerData;
      });
      
      res.status(201).json({
        success: true,
        sellers: sellersData,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// delete seller ---admin
router.delete(
  "/delete-seller/:id",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const seller = await Shop.findById(req.params.id);

      if (!seller) {
        return next(
          new ErrorHandler("Seller is not available with this id", 400)
        );
      }

      await Shop.findByIdAndDelete(req.params.id);

      res.status(201).json({
        success: true,
        message: "Seller deleted successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update seller withdraw methods --- sellers
router.put(
  "/update-payment-methods",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      // Check app type to conditionally allow withdraw-related operations
      const Configuration = require("../model/Configuration");
      const configuration = await Configuration.findOne({ isActive: true });
      
      if (configuration && configuration.appType === 'singlevendor') {
        return next(new ErrorHandler("Withdraw functionality is not available for single vendor apps", 403));
      }

      const { withdrawMethod } = req.body;

      const seller = await Shop.findByIdAndUpdate(req.seller._id, {
        withdrawMethod,
      });

      res.status(201).json({
        success: true,
        seller,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// delete seller withdraw merthods --- only seller
router.delete(
  "/delete-withdraw-method/",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      // Check app type to conditionally allow withdraw-related operations
      const Configuration = require("../model/Configuration");
      const configuration = await Configuration.findOne({ isActive: true });
      
      if (configuration && configuration.appType === 'singlevendor') {
        return next(new ErrorHandler("Withdraw functionality is not available for single vendor apps", 403));
      }

      const seller = await Shop.findById(req.seller._id);

      if (!seller) {
        return next(new ErrorHandler("Seller not found with this id", 400));
      }

      seller.withdrawMethod = null;

      await seller.save();

      res.status(201).json({
        success: true,
        seller,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;
