const express = require("express");
const { isAuthenticated } = require("../middleware/auth");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const UserPost = require("../model/userPost");
const ErrorHandler = require("../utils/ErrorHandler");
const router = express.Router();

// Test endpoint to bypass UserPost model issues
router.get(
  "/test",
  catchAsyncErrors(async (req, res) => {
    try {
      const { CATEGORY_FORMS } = require("../configs/categoryForms");
      res.status(200).json({
        success: true,
        message: "Test endpoint working",
        categoryForms: Object.keys(CATEGORY_FORMS)
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Check post cost for a category
router.post(
  "/check-post-cost",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { categoryName } = req.body;
      const userId = req.user._id;

      if (!categoryName) {
        return next(new ErrorHandler("Category name is required", 400));
      }

      // Get category configuration
      const { CATEGORY_FORMS } = require("../configs/categoryForms");
      const categoryKey = Object.keys(CATEGORY_FORMS).find(key => 
        CATEGORY_FORMS[key].name.toLowerCase() === categoryName.toLowerCase()
      );
      
      if (!categoryKey) {
        return next(new ErrorHandler("Category not found", 404));
      }
      
      const config = CATEGORY_FORMS[categoryKey];
      const freePostsLimit = config.freePosts || 0;

      // Count actual free posts used by this user in this category
      const Product = require("../model/product");
      const Category = require("../model/Category");
      
      // Find the category ID
      const category = await Category.findOne({ name: categoryName });
      if (!category) {
        return next(new ErrorHandler("Category not found", 404));
      }

      // Count user's products in this category that were posted for free
      const freePostsUsed = await Product.countDocuments({
        userId: userId,
        category: category._id,
        isPaid: false, // Only count free posts
        status: { $ne: 'deleted' } // Don't count deleted products
      });

      console.log(`User ${userId} has used ${freePostsUsed} free posts out of ${freePostsLimit} for category ${categoryName}`);

      const canPostForFree = freePostsUsed < freePostsLimit;
      const postCost = canPostForFree ? 0 : config.price;

      res.status(200).json({
        success: true,
        canPostForFree,
        postCost,
        categoryName,
        freePostsUsed,
        freePostsLimit
      });
    } catch (error) {
      console.error('Error checking post cost:', error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Get user's post statistics
router.get(
  "/stats",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const userId = req.user._id;
      const userPost = await UserPost.findOne({ user: userId });

      if (!userPost) {
        return res.status(200).json({
          success: true,
          data: {
            totalFreePostsUsed: 0,
            totalPaidPosts: 0,
            totalAmountPaid: 0,
            categoryPosts: {}
          }
        });
      }

      res.status(200).json({
        success: true,
        data: {
          totalFreePostsUsed: userPost.totalFreePostsUsed,
          totalPaidPosts: userPost.totalPaidPosts,
          totalAmountPaid: userPost.totalAmountPaid,
          categoryPosts: Object.fromEntries(userPost.categoryPosts)
        }
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Helper function to get category key from category name
function getCategoryKey(categoryName) {
  const { CATEGORY_FORMS } = require("../configs/categoryForms");
  return Object.keys(CATEGORY_FORMS).find(key => 
    CATEGORY_FORMS[key].name.toLowerCase() === categoryName.toLowerCase()
  );
}

// Helper function to get free posts limit for category
function getCategoryFreePostsLimit(categoryName) {
  const { CATEGORY_FORMS } = require("../configs/categoryForms");
  const categoryKey = getCategoryKey(categoryName);
  return categoryKey ? CATEGORY_FORMS[categoryKey].freePosts : 0;
}

module.exports = router;
