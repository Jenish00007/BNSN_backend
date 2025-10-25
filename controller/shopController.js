const Shop = require("../model/shop");
const Product = require("../model/product");
const Category = require("../model/Category");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../utils/ErrorHandler");

// Get popular shops based on number of products and ratings
exports.getPopularShops = catchAsyncErrors(async (req, res, next) => {
  const shops = await Shop.aggregate([
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "shopId",
        as: "products"
      }
    },
    {
      $addFields: {
        totalProducts: { $size: "$products" },
        averageRating: { $avg: "$products.ratings" }
      }
    },
    {
      $sort: {
        totalProducts: -1,
        averageRating: -1
      }
    },
    {
      $limit: 10
    }
  ]);

  // Check app type to conditionally hide withdraw-related fields
  const Configuration = require("../model/Configuration");
  const configuration = await Configuration.findOne({ isActive: true });
  
  let shopsData = shops.map(shop => {
    // If app type is single vendor, hide withdraw-related fields
    if (configuration && configuration.appType === 'singlevendor') {
      delete shop.withdrawMethod;
      delete shop.availableBalance;
      delete shop.transections;
    }
    
    return shop;
  });

  res.status(200).json({
    success: true,
    shops: shopsData
  });
});

// Get latest shops
exports.getLatestShops = catchAsyncErrors(async (req, res, next) => {
  const shops = await Shop.find()
    .sort({ createdAt: -1 })
    .limit(10);

  // Check app type to conditionally hide withdraw-related fields
  const Configuration = require("../model/Configuration");
  const configuration = await Configuration.findOne({ isActive: true });
  
  let shopsData = shops.map(shop => {
    let shopData = shop.toObject();
    
    // If app type is single vendor, hide withdraw-related fields
    if (configuration && configuration.appType === 'singlevendor') {
      delete shopData.withdrawMethod;
      delete shopData.availableBalance;
      delete shopData.transections;
    }
    
    return shopData;
  });

  res.status(200).json({
    success: true,
    shops: shopsData
  });
});

// Get shops with top offers
exports.getTopOfferShops = catchAsyncErrors(async (req, res, next) => {
  const shops = await Shop.aggregate([
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "shopId",
        as: "products"
      }
    },
    {
      $addFields: {
        discountedProducts: {
          $filter: {
            input: "$products",
            as: "product",
            cond: { $gt: ["$$product.originalPrice", "$$product.discountPrice"] }
          }
        }
      }
    },
    {
      $match: {
        "discountedProducts.0": { $exists: true }
      }
    },
    {
      $sort: { "discountedProducts": -1 }
    },
    {
      $limit: 10
    }
  ]);

  // Check app type to conditionally hide withdraw-related fields
  const Configuration = require("../model/Configuration");
  const configuration = await Configuration.findOne({ isActive: true });
  
  let shopsData = shops.map(shop => {
    // If app type is single vendor, hide withdraw-related fields
    if (configuration && configuration.appType === 'singlevendor') {
      delete shop.withdrawMethod;
      delete shop.availableBalance;
      delete shop.transections;
    }
    
    return shop;
  });

  res.status(200).json({
    success: true,
    shops: shopsData
  });
});

// Get recommended shops based on user's location and preferences
exports.getRecommendedShops = catchAsyncErrors(async (req, res, next) => {
  const { latitude, longitude, radius = 10 } = req.query; // radius in kilometers

  if (!latitude || !longitude) {
    return next(new ErrorHandler("Please provide location coordinates", 400));
  }

  // Validate coordinates
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  if (isNaN(lat) || isNaN(lng)) {
    return next(new ErrorHandler("Invalid coordinates provided", 400));
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return next(new ErrorHandler("Coordinates out of valid range", 400));
  }

  const shops = await Shop.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [lng, lat] // Correct order: [longitude, latitude]
        },
        $maxDistance: radius * 1000 // Convert to meters
      }
    }
  }).limit(10);

  // Check app type to conditionally hide withdraw-related fields
  const Configuration = require("../model/Configuration");
  const configuration = await Configuration.findOne({ isActive: true });
  
  let shopsData = shops.map(shop => {
    let shopData = shop.toObject();
    
    // If app type is single vendor, hide withdraw-related fields
    if (configuration && configuration.appType === 'singlevendor') {
      delete shopData.withdrawMethod;
      delete shopData.availableBalance;
      delete shopData.transections;
    }
    
    return shopData;
  });

  res.status(200).json({
    success: true,
    shops: shopsData
  });
});

// Get all stores with filters
exports.getAllStores = catchAsyncErrors(async (req, res, next) => {
  const { featured, offset = 0, limit = 50 } = req.query;
  
  // Build query
  const query = {};
  
  if (featured === '1') {
    query.featured = true;
  }

  // Calculate skip value for pagination
  const skip = parseInt(offset);
  const limitValue = parseInt(limit);

  // Execute query with sorting and pagination
  const shops = await Shop.find(query)
    .select('-password -resetPasswordToken -resetPasswordTime')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitValue);

  // Get total count for pagination
  const total = await Shop.countDocuments(query);

  // Check app type to conditionally hide withdraw-related fields
  const Configuration = require("../model/Configuration");
  const configuration = await Configuration.findOne({ isActive: true });
  
  let shopsData = shops.map(shop => {
    let shopData = shop.toObject();
    
    // If app type is single vendor, hide withdraw-related fields
    if (configuration && configuration.appType === 'singlevendor') {
      delete shopData.withdrawMethod;
      delete shopData.availableBalance;
      delete shopData.transections;
    }
    
    return shopData;
  });

  res.status(200).json({
    success: true,
    shops: shopsData,
    total,
    currentPage: Math.floor(skip / limitValue) + 1,
    totalPages: Math.ceil(total / limitValue)
  });
});

// Get categories by shop id
exports.getCategoriesByShopId = catchAsyncErrors(async (req, res, next) => {
  const { shopId } = req.params;
  const { offset = 0, limit = 20 } = req.query;

  if (!shopId) {
    return next(new ErrorHandler('Shop ID is required', 400));
  }

  const shop = await Shop.findById(shopId);

  if (!shop) {
    return next(new ErrorHandler('Shop not found', 404));
  }
  
  // get categories from products of this shop
  const categories = await Product.distinct("category", { shopId })
    .populate('category')
    .lean();
  
  const getCategoryDetails = await Category.find({ _id: { $in: categories } })
    .skip(parseInt(offset))
    .limit(parseInt(limit))
    .lean();

  const countCategories = categories.length;

  res.status(200).json({
    success: true,
    shop: shop,
    categories: getCategoryDetails,
    total: countCategories,
    currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
    totalPages: Math.ceil(countCategories / parseInt(limit))
  });

});

exports.getProductsByShopCategories = catchAsyncErrors(async (req, res, next) => {
  const { shopId, categoryId } = req.params;
  const { offset = 0, limit = 20 } = req.query;
  if (!shopId || !categoryId) {
    return next(new ErrorHandler('Shop ID and Category ID are required', 400));
  }

  const products = await Product.find({ shopId, category: categoryId })
    .populate('category')
    .sort({createdAt: -1})
    .lean()
    .skip(parseInt(offset))
    .limit(parseInt(limit));

  const total = await Product.countDocuments({ shopId, category: categoryId });

  res.status(200).json({
    success: true,
    products,
    total,
    currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
    totalPages: Math.ceil(total / parseInt(limit))
  });
});

// Update Expo push notification token for shop
exports.updateExpoPushToken = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.body;
  if (!token) {
    return next(new ErrorHandler('Expo push token is required', 400));
  }
  const shop = await Shop.findById(req.seller._id);
  if (!shop) {
    return next(new ErrorHandler('Shop not found', 404));
  }
  shop.expoPushToken = token;
  await shop.save();
  res.status(200).json({ success: true, message: 'Expo push token updated', token });
}); 