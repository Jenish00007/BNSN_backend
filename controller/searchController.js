const Product = require("../model/product");
const Shop = require("../model/shop");
const Category = require("../model/Category");
const Subcategory = require("../model/Subcategory");

// Search products with filters
exports.searchProducts = async (req, res) => {
  try {
    const {
      keyword,
      category,
      minPrice,
      maxPrice,
      rating,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    // Build search query
    const query = {};

    console.log("Search parameters:", {
      keyword,
      category,
      minPrice,
      maxPrice,
      rating,
      sortBy,
      sortOrder,
      page,
      limit,
    });

    if (keyword) {
      const orConditions = [
        { name: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
        { tags: { $regex: keyword, $options: "i" } },
      ];

      // Search by category/subcategory name: find matching IDs first, then include in product query
      const matchingCategories = await Category.find({
        name: { $regex: keyword, $options: "i" },
      }).select("_id");
      const matchingSubcategories = await Subcategory.find({
        name: { $regex: keyword, $options: "i" },
      }).select("_id");
      const categoryIds = matchingCategories.map((c) => c._id);
      const subcategoryIds = matchingSubcategories.map((s) => s._id);
      if (categoryIds.length > 0)
        orConditions.push({ category: { $in: categoryIds } });
      if (subcategoryIds.length > 0)
        orConditions.push({ subcategory: { $in: subcategoryIds } });

      query.$or = orConditions;
    }

    if (category) {
      query.category = category;
    }

    if (minPrice || maxPrice) {
      query.discountPrice = {};
      if (minPrice) query.discountPrice.$gte = Number(minPrice);
      if (maxPrice) query.discountPrice.$lte = Number(maxPrice);
    }

    if (rating) {
      query.ratings = { $gte: Number(rating) };
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Execute search with sorting and pagination
    const products = await Product.find(query)
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .skip(skip)
      .limit(Number(limit));

    // Get total count for pagination
    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      products,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Search shops with filters
exports.searchShops = async (req, res) => {
  try {
    const {
      keyword,
      minRating,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    // Build search query
    const query = {};

    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
        { address: { $regex: keyword, $options: "i" } },
      ];
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Execute search with sorting and pagination
    const shops = await Shop.find(query)
      .select("-password -resetPasswordToken -resetPasswordTime")
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .skip(skip)
      .limit(Number(limit));

    // Get total count for pagination
    const total = await Shop.countDocuments(query);

    res.status(200).json({
      success: true,
      shops,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
