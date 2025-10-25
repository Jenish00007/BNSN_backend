const express = require("express");
const { isSeller, isAuthenticated, isAdmin } = require("../middleware/auth");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const router = express.Router();
const Product = require("../model/product");
const Order = require("../model/order");
const Shop = require("../model/shop");
const Category = require("../model/Category");
const Subcategory = require("../model/Subcategory");
const Unit = require("../model/Unit");
const { upload, handleMulterError } = require("../multer");
const ErrorHandler = require("../utils/ErrorHandler");
const mongoose = require("mongoose");

// Helper function to validate MongoDB ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// create product
router.post(
  "/create-product",
  upload.array("images"),
  handleMulterError,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { shopId, category, subcategory } = req.body;
      
      // Validate shop ID
      if (!shopId || !isValidObjectId(shopId)) {
        return next(new ErrorHandler("Invalid shop ID format", 400));
      }

      // Validate category ID
      if (!category || !isValidObjectId(category)) {
        return next(new ErrorHandler("Invalid category ID format", 400));
      }

      // Validate subcategory ID
      if (!subcategory || !isValidObjectId(subcategory)) {
        return next(new ErrorHandler("Invalid subcategory ID format", 400));
      }

      // Check if shop exists
      const shop = await Shop.findById(shopId);
      if (!shop) {
        return next(new ErrorHandler("Shop not found!", 404));
      }

      // Check if category exists
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return next(new ErrorHandler("Category not found!", 404));
      }

      // Check if subcategory exists and belongs to the selected category
      const subcategoryExists = await Subcategory.findOne({
        _id: subcategory,
        category: category
      });
      if (!subcategoryExists) {
        return next(new ErrorHandler("Subcategory not found or does not belong to the selected category!", 404));
      }

      const files = req.files;
      const imageUrls = files.map((file) => file.location);

      const productData = req.body;
      productData.images = imageUrls;
      productData.shop = shop;

      const product = await Product.create(productData);

      res.status(201).json({
        success: true,
        product,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  })
);

// get all products of a shop
router.get(
  "/get-all-products-shop/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const shopId = req.params.id;
      
      if (!shopId || !isValidObjectId(shopId)) {
        return next(new ErrorHandler("Invalid shop ID format", 400));
      }

      const products = await Product.find({ shopId })
        .populate('category', 'name')
        .populate('subcategory', 'name');

      res.status(200).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  })
);

// delete product of a shop
router.delete(
  "/delete-shop-product/:id",
  // isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const productId = req.params.id;

      if (!productId || !isValidObjectId(productId)) {
        return next(new ErrorHandler("Invalid product ID format", 400));
      }

      const productData = await Product.findById(productId);
      
      if (!productData) {
        return next(new ErrorHandler("Product not found!", 404));
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

// get all products
router.get(
  "/get-all-products",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      
      // Calculate skip value for pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const limitValue = parseInt(limit);

      // Execute query with sorting and pagination
      const products = await Product.find()
        .populate('category', 'name')
        .populate('subcategory', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitValue);

      // Get total count for pagination
      const total = await Product.countDocuments();

      res.status(200).json({
        success: true,
        products,
        total,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limitValue),
        hasMore: skip + limitValue < total
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
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

      if (!productId || !isValidObjectId(productId)) {
        return next(new ErrorHandler("Invalid product ID format", 400));
      }

      if (!orderId || !isValidObjectId(orderId)) {
        return next(new ErrorHandler("Invalid order ID format", 400));
      }

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
        (rev) => rev.user._id === req.user._id
      );

      if (isReviewed) {
        product.reviews.forEach((rev) => {
          if (rev.user._id === req.user._id) {
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

      await Order.findByIdAndUpdate(
        orderId,
        { $set: { "cart.$[elem].isReviewed": true } },
        { arrayFilters: [{ "elem._id": productId }], new: true }
      );

      res.status(200).json({
        success: true,
        message: "Review submitted successfully!",
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
        .populate('category', 'name')
        .populate('subcategory', 'name')
        .sort({
          createdAt: -1,
        });
      res.status(200).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update product
router.put(
  "/update-product/:id",
  upload.array("images"),
  handleMulterError,
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const productId = req.params.id;
      if (!productId || !isValidObjectId(productId)) {
        return next(new ErrorHandler("Invalid product ID format", 400));
      }
      const product = await Product.findById(productId);
      if (!product) {
        return next(new ErrorHandler("Product not found!", 404));
      }
      // Check if the product belongs to the seller
      if (product.shopId !== req.seller._id.toString()) {
        return next(new ErrorHandler("You are not authorized to update this product!", 403));
      }

      // Parse fields from req.body
      const {
        name,
        description,
        category,
        subcategory,
        tags,
        originalPrice,
        discountPrice,
        stock,
        unit,
        unitCount,
        maxPurchaseQuantity,
      } = req.body;

      // Validate category ID if provided
      if (category && !isValidObjectId(category)) {
        return next(new ErrorHandler("Invalid category ID format", 400));
      }
      // Validate subcategory ID if provided
      if (subcategory && !isValidObjectId(subcategory)) {
        return next(new ErrorHandler("Invalid subcategory ID format", 400));
      }
      // Check if category exists if provided
      if (category) {
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
          return next(new ErrorHandler("Category not found!", 404));
        }
      }
      // Check if subcategory exists and belongs to the selected category if provided
      if (subcategory && category) {
        const subcategoryExists = await Subcategory.findOne({
          _id: subcategory,
          category: category
        });
        if (!subcategoryExists) {
          return next(new ErrorHandler("Subcategory not found or does not belong to the selected category!", 404));
        }
      }

      // Handle images: merge existing image URLs and new uploads
      let images = [];
      
      // Parse existing image URLs from req.body.existingImages
      let existingImages = [];
      if (req.body.existingImages) {
        try {
          // Handle both string and array formats
          if (typeof req.body.existingImages === 'string') {
            existingImages = JSON.parse(req.body.existingImages);
          } else if (Array.isArray(req.body.existingImages)) {
            existingImages = req.body.existingImages;
          }
          console.log('Existing images parsed:', existingImages);
        } catch (parseError) {
          console.error('Error parsing existingImages:', parseError);
          return next(new ErrorHandler("Invalid existing images format", 400));
        }
      }
      
      // Add existing images to the images array
      images = images.concat(existingImages);
      
      // Add new uploaded images
      if (req.files && req.files.length > 0) {
        const uploadedUrls = req.files.map(file => file.location);
        console.log('New uploaded images:', uploadedUrls);
        images = images.concat(uploadedUrls);
      }

      console.log('Total images before validation:', images);

      // Validate that we have at least one image
      if (images.length === 0) {
        return next(new ErrorHandler("At least one product image is required", 400));
      }

      // Validate image URLs (basic check)
      const validImages = images.filter(img => {
        return typeof img === 'string' && img.trim().length > 0;
      });

      console.log('Valid images after filtering:', validImages);

      if (validImages.length === 0) {
        return next(new ErrorHandler("No valid images provided", 400));
      }

      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        {
          name,
          description,
          category,
          subcategory,
          tags,
          originalPrice,
          discountPrice,
          stock,
          unit,
          unitCount,
          maxPurchaseQuantity,
          images: validImages,
        },
        { new: true, runValidators: true }
      );

      res.status(200).json({
        success: true,
        product: updatedProduct,
        message: "Product updated successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  })
);

// Get products by category/subcategory
router.get(
  "/categories/items/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { id } = req.params;
      const { limit = 10, offset = 1, type = 'all' } = req.query;
      const { zoneId, moduleId } = req.headers;

      // Build query
      const query = {};
      
      // If ID is provided, check if it's a category or subcategory
      if (id && id !== '0') {
        // First check if it's a category
        const category = await Category.findById(id);
        if (category) {
          query.category = id;
        } else {
          // If not a category, check if it's a subcategory
          const subcategory = await Subcategory.findById(id);
          if (subcategory) {
            query.subcategory = id;
          } else {
            return next(new ErrorHandler("Invalid category or subcategory ID", 404));
          }
        }
      }

      // Add module filter if provided
      if (moduleId) {
        query.moduleId = moduleId;
      }

      // Add type filter if not 'all'
      if (type !== 'all') {
        query.type = type;
      }

      // Calculate skip value for pagination
      const skip = (parseInt(offset) - 1) * parseInt(limit);
      const limitValue = parseInt(limit);

      // Execute query with sorting and pagination
      const products = await Product.find(query)
        .populate('category', 'name')
        .populate('subcategory', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitValue);

      // Get total count for pagination
      const total = await Product.countDocuments(query);

      res.status(200).json({
        success: true,
        products,
        total,
        currentPage: parseInt(offset),
        totalPages: Math.ceil(total / limitValue)
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Search products with category filter
router.get(
  "/items/search",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { name, category_id, type = 'all', offset = 1, limit = 50 } = req.query;
      const { zoneId, moduleId } = req.headers;

      // Build search query
      const query = {};

      // Add name search if provided
      if (name) {
        query.$or = [
          { name: { $regex: name, $options: 'i' } },
          { description: { $regex: name, $options: 'i' } },
          { tags: { $regex: name, $options: 'i' } }
        ];
      }

      // Add category filter if provided and not '0'
      if (category_id && category_id !== '0') {
        // First check if it's a category
        const category = await Category.findById(category_id);
        if (category) {
          query.category = category_id;
        } else {
          // If not a category, check if it's a subcategory
          const subcategory = await Subcategory.findById(category_id);
          if (subcategory) {
            query.subcategory = category_id;
          }
        }
      }
      // If category_id is not provided or is '0', search across all categories

      // Add module filter if provided
      if (moduleId) {
        query.moduleId = moduleId;
      }

      // Add type filter if not 'all'
      if (type !== 'all') {
        query.type = type;
      }

      // Calculate skip value for pagination
      const skip = (parseInt(offset) - 1) * parseInt(limit);
      const limitValue = parseInt(limit);

      // Execute search with sorting and pagination
      const products = await Product.find(query)
        .populate('category', 'name')
        .populate('subcategory', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitValue);

      // Get total count for pagination
      const total = await Product.countDocuments(query);

      // Get category and subcategory information for each product
      const productsWithDetails = await Promise.all(products.map(async (product) => {
        const productObj = product.toObject();
        
        // Get category details if not populated
        if (!productObj.category || typeof productObj.category === 'string') {
          const category = await Category.findById(product.category);
          productObj.category = category ? {
            _id: category._id,
            name: category.name
          } : null;
        }

        // Get subcategory details if not populated
        if (!productObj.subcategory || typeof productObj.subcategory === 'string') {
          const subcategory = await Subcategory.findById(product.subcategory);
          productObj.subcategory = subcategory ? {
            _id: subcategory._id,
            name: subcategory.name
          } : null;
        }

        return productObj;
      }));

      res.status(200).json({
        success: true,
        products: productsWithDetails,
        total,
        currentPage: parseInt(offset),
        totalPages: Math.ceil(total / limitValue)
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Get all available units
router.get(
  "/units",
  catchAsyncErrors(async (req, res, next) => {
    try {
      // Get units from the database
      const units = await Unit.find({ isActive: true })
        .sort({ sortOrder: 1, name: 1 });

      // If no units found in database, return default units
      if (units.length === 0) {
        const defaultUnits = [
          { id: 'kg', name: 'Kilograms (kg)', description: 'Weight in kilograms', category: 'weight' },
          { id: 'g', name: 'Grams (g)', description: 'Weight in grams', category: 'weight' },
          { id: 'pcs', name: 'Pieces (pcs)', description: 'Individual items', category: 'count' },
          { id: 'ml', name: 'Milliliters (ml)', description: 'Volume in milliliters', category: 'volume' },
          { id: 'ltr', name: 'Liters (ltr)', description: 'Volume in liters', category: 'volume' },
          { id: 'pack', name: 'Pack', description: 'Packaged items', category: 'count' }
        ];

        // Create default units in database
        await Unit.insertMany(defaultUnits);
        
        res.status(200).json({
          success: true,
          data: defaultUnits
        });
      } else {
        res.status(200).json({
          success: true,
          data: units
        });
      }
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;
