const express = require("express");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { upload } = require("../multer");
const Shop = require("../model/shop");
const User = require("../model/user"); // Add User model
const Product = require("../model/product");
const Order = require("../model/order");
const ErrorHandler = require("../utils/ErrorHandler");
const { isSeller, isAdmin, isAuthenticated } = require("../middleware/auth");
const router = express.Router();
const fs = require("fs");

// Helper function to get S3 URL
const getS3Url = (filename) => {
  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`;
};

// create product - UPDATED to support both sellers and regular users
router.post(
  "/create-product",
  isAuthenticated, // Only require authentication, not seller-specific
  upload.array("images"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { shopId, userId } = req.body;

      // Accept either shopId (for sellers) or userId (for regular users posting ads)
      if (!shopId && !userId) {
        return next(new ErrorHandler("Shop ID or User ID is required!", 400));
      }

      // Validate shop if shopId is provided
      if (shopId) {
        const shop = await Shop.findById(shopId);
        if (!shop) {
          return next(new ErrorHandler("Shop not found!", 400));
        }
      }

      // Validate user if userId is provided
      if (userId) {
        const user = await User.findById(userId);
        if (!user) {
          return next(new ErrorHandler("User not found!", 400));
        }
      }

      // Handle image uploads
      if (!req.files || req.files.length === 0) {
        return next(new ErrorHandler("Please upload at least one image", 400));
      }

      const files = req.files;
      const imageUrls = files.map((file) => ({
        url: file.location || getS3Url(file.key), // Use file.location for S3 or construct URL
        key: file.key,
      }));

      const productData = req.body;
      productData.images = imageUrls;

      // Set the owner - shopId for sellers, userId for regular users
      if (shopId) {
        productData.shopId = shopId;
      }
      if (userId) {
        productData.userId = userId;
      }

      // Validate required fields
      const requiredFields = [
        "name",
        "description",
        "category",
        "subcategory",
        "discountPrice",
        "stock",
        "unit",
        "unitCount",
      ];
      for (const field of requiredFields) {
        if (!productData[field]) {
          return next(new ErrorHandler(`Please provide ${field}`, 400));
        }
      }

      const product = await Product.create(productData);

      res.status(201).json({
        success: true,
        product,
      });
    } catch (error) {
      console.error("Error creating product:", error);
      return next(new ErrorHandler(error.message, 400));
    }
  })
);

// get all products
router.get("/get-all-products", async (req, res, next) => {
  try {
    const products = await Product.find()
      .populate("category", "name")
      .populate("subcategory", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    return next(new ErrorHandler(error, 400));
  }
});

// get all products of a shop
router.get(
  "/get-all-products/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.find({ shopId: req.params.id })
        .populate("category", "name")
        .populate("subcategory", "name");

      res.status(200).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// get all products of a user (for regular users who post ads)
router.get(
  "/get-user-products/:userId",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.find({ userId: req.params.userId })
        .populate("category", "name")
        .populate("subcategory", "name");

      res.status(200).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// delete product of a shop or user
router.delete(
  "/delete-product/:id",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const productId = req.params.id;
      const product = await Product.findById(productId);

      if (!product) {
        return next(new ErrorHandler("Product not found!", 404));
      }

      // Check if user has permission to delete
      const isOwner =
        (product.shopId &&
          product.shopId.toString() === req.seller?._id?.toString()) ||
        (product.userId &&
          product.userId.toString() === req.user?._id?.toString());

      if (!isOwner && req.user?.role !== "Admin") {
        return next(
          new ErrorHandler(
            "You don't have permission to delete this product",
            403
          )
        );
      }

      // Delete images from S3 if needed
      if (product.images && product.images.length > 0) {
        product.images.forEach((image) => {
          // If using local storage
          if (image.key && !image.url.startsWith("http")) {
            const filePath = `uploads/${image.key}`;
            fs.unlink(filePath, (err) => {
              if (err) {
                console.log("Error deleting file:", err);
              }
            });
          }
          // For S3, you might want to implement S3 deletion here
        });
      }

      await Product.findByIdAndDelete(productId);

      res.status(200).json({
        success: true,
        message: "Product deleted successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  })
);

// update product
router.put(
  "/update-product/:id",
  isAuthenticated,
  upload.array("images"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const productId = req.params.id;
      const product = await Product.findById(productId);

      if (!product) {
        return next(new ErrorHandler("Product not found!", 404));
      }

      // Check if user has permission to update
      const isOwner =
        (product.shopId &&
          product.shopId.toString() === req.seller?._id?.toString()) ||
        (product.userId &&
          product.userId.toString() === req.user?._id?.toString());

      if (!isOwner && req.user?.role !== "Admin") {
        return next(
          new ErrorHandler(
            "You don't have permission to update this product",
            403
          )
        );
      }

      // Handle new images if uploaded
      let imageUrls = product.images;
      if (req.files && req.files.length > 0) {
        const files = req.files;
        imageUrls = files.map((file) => ({
          url: file.location || getS3Url(file.key),
          key: file.key,
        }));
      }

      const updateData = {
        ...req.body,
        images: imageUrls,
      };

      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        updateData,
        { new: true, runValidators: true }
      );

      res.status(200).json({
        success: true,
        product: updatedProduct,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  })
);

// all products --- for admin
router.get(
  "/admin-all-products",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.find()
        .populate("category", "name")
        .populate("subcategory", "name")
        .populate("shopId", "name")
        .populate("userId", "name email")
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// review for a product
router.put(
  "/create-new-review",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { user, rating, comment, productId, orderId } = req.body;

      const product = await Product.findById(productId);

      if (!product) {
        return next(new ErrorHandler("Product not found!", 404));
      }

      const review = {
        user,
        rating,
        comment,
        productId,
      };

      const isReviewed = product.reviews.find(
        (rev) => rev.user._id.toString() === req.user._id.toString()
      );

      if (isReviewed) {
        product.reviews.forEach((rev) => {
          if (rev.user._id.toString() === req.user._id.toString()) {
            rev.rating = rating;
            rev.comment = comment;
            rev.user = user;
          }
        });
      } else {
        product.reviews.push(review);
      }

      let avg = 0;
      product.reviews.forEach((rev) => {
        avg += rev.rating;
      });

      product.ratings = avg / product.reviews.length;

      await product.save({ validateBeforeSave: false });

      if (orderId) {
        await Order.findByIdAndUpdate(
          orderId,
          { $set: { "cart.$[elem].isReviewed": true } },
          { arrayFilters: [{ "elem._id": productId }], new: true }
        );
      }

      res.status(200).json({
        success: true,
        message: "Reviewed successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  })
);

// Get single product details
router.get(
  "/get-product/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const product = await Product.findById(req.params.id)
        .populate("category", "name")
        .populate("subcategory", "name")
        .populate(
          "shopId",
          "name avatar address email phoneNumber hidePhoneNumber"
        )
        .populate("userId", "name avatar email phoneNumber hidePhoneNumber");

      if (!product) {
        return next(new ErrorHandler("Product not found!", 404));
      }

      // Convert product to object to modify it
      const productObj = product.toObject();

      // If product has shopId, copy populated shopId to shop field
      if (productObj.shopId && typeof productObj.shopId === "object") {
        productObj.shop = productObj.shopId;
      }

      // If product has userId (customer upload), create shop object from user info
      if (
        !productObj.shop &&
        productObj.userId &&
        typeof productObj.userId === "object"
      ) {
        productObj.shop = {
          _id: productObj.userId._id,
          name: productObj.userId.name,
          avatar: productObj.userId.avatar,
          email: productObj.userId.email,
          phoneNumber: productObj.userId.phoneNumber,
          hidePhoneNumber: productObj.userId.hidePhoneNumber,
        };
      }

      res.status(200).json({
        success: true,
        product: productObj,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  })
);

// get all products of a user (for regular users who post ads)
router.get(
  "/get-user-products/:userId",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { userId } = req.params;

      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return next(new ErrorHandler("Invalid user ID format", 400));
      }

      const products = await Product.find({ userId })
        .populate("category", "name")
        .populate("subcategory", "name")
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  })
);

module.exports = router;
