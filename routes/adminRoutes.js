const express = require("express");
const router = express.Router();
const { isAuthenticated, isAdmin } = require("../middleware/auth");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../utils/ErrorHandler");
const User = require("../model/user");
const Shop = require("../model/shop");
const Order = require("../model/order");
const Product = require("../model/product");
const { getDeliveryManPreview } = require("../controller/deliveryman");

// Get dashboard stats
router.get("/dashboard-stats", isAuthenticated, isAdmin("Admin"), catchAsyncErrors(async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalSellers = await Shop.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $match: { status: "Delivered" } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } }
    ]);

    res.status(200).json({
      success: true,
      totalUsers,
      totalSellers,
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
}));

// Get all users
router.get("/users", isAuthenticated, isAdmin("Admin"), catchAsyncErrors(async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
}));

// Get all sellers
router.get("/sellers", isAuthenticated, isAdmin("Admin"), catchAsyncErrors(async (req, res, next) => {
  try {
    const sellers = await Shop.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      sellers
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
}));

// Get all products
router.get("/products", isAuthenticated, isAdmin("Admin"), catchAsyncErrors(async (req, res, next) => {
  try {
    const products = await Product.find()
      .populate("shop", "name")
      .populate("category", "name")
      .populate("subcategory", "name")
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      products
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
}));

// Delete product
router.delete("/product/:id", isAuthenticated, isAdmin("Admin"), catchAsyncErrors(async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return next(new ErrorHandler("Product not found", 404));
    }

    await product.deleteOne();
    
    res.status(200).json({
      success: true,
      message: "Product deleted successfully"
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
}));

// Get delivery man preview
router.get("/delivery-man/:id", isAuthenticated, isAdmin("Admin"), catchAsyncErrors(getDeliveryManPreview));

module.exports = router; 