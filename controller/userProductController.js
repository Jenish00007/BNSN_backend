const Product = require("../model/product");
const Event = require("../model/event");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../utils/ErrorHandler");

// Get recommended products
exports.getRecommendedProducts = catchAsyncErrors(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  
  // Calculate skip value for pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitValue = parseInt(limit);

  // Execute query with sorting and pagination
  const products = await Product.find()
    .populate('category', 'name')
    .populate('subcategory', 'name')
    .sort({ ratings: -1, sold_out: -1 })
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
});

// Get top offers (products with highest discount)
exports.getTopOffers = catchAsyncErrors(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  
  // Calculate skip value for pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitValue = parseInt(limit);

  // Build aggregation pipeline with pagination
  const pipeline = [
    {
      $match: {
        originalPrice: { $exists: true, $ne: null },
        discountPrice: { $exists: true, $ne: null }
      }
    },
    {
      $addFields: {
        discountPercentage: {
          $multiply: [
            {
              $divide: [
                { $subtract: ["$originalPrice", "$discountPrice"] },
                "$originalPrice"
              ]
            },
            100
          ]
        }
      }
    },
    {
      $sort: { discountPercentage: -1 }
    },
    {
      $facet: {
        products: [
          { $skip: skip },
          { $limit: limitValue }
        ],
        totalCount: [
          { $count: "count" }
        ]
      }
    }
  ];

  const result = await Product.aggregate(pipeline);
  const products = result[0].products;
  const total = result[0].totalCount[0]?.count || 0;

  // Populate category and subcategory for aggregated results
  const populatedProducts = await Product.populate(products, [
    { path: 'category', select: 'name' },
    { path: 'subcategory', select: 'name' }
  ]);

  res.status(200).json({
    success: true,
    products: populatedProducts,
    total,
    currentPage: parseInt(page),
    totalPages: Math.ceil(total / limitValue),
    hasMore: skip + limitValue < total
  });
});

// Get most popular items (based on sold_out and ratings)
exports.getMostPopularItems = catchAsyncErrors(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  
  // Calculate skip value for pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitValue = parseInt(limit);

  // Execute query with sorting and pagination
  const products = await Product.find()
    .populate('category', 'name')
    .populate('subcategory', 'name')
    .sort({ sold_out: -1, ratings: -1 })
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
});

// Get latest items
exports.getLatestItems = catchAsyncErrors(async (req, res, next) => {
  const { store_id, category_id, page = 1, limit = 10, type = 'all' } = req.query;
  
  // Build query
  const query = {};
  
  if (store_id && store_id !== '0') {
    query.shopId = store_id;
  }
  
  if (category_id && category_id !== '0') {
    query.category = category_id;
  }
  
  if (type !== 'all') {
    query.type = type;
  }

  // Calculate skip value for pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
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
    currentPage: parseInt(page),
    totalPages: Math.ceil(total / limitValue),
    hasMore: skip + limitValue < total
  });
});

// Get flash sale items (from events collection)
exports.getFlashSaleItems = catchAsyncErrors(async (req, res, next) => {
  const currentDate = new Date();
  
  const flashSaleItems = await Event.find({
    start_Date: { $lte: currentDate },
    Finish_Date: { $gte: currentDate },
    status: "Running",
  }).limit(10);

  res.status(200).json({
    success: true,
    flashSaleItems,
  });
}); 