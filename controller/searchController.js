const Product = require("../model/product");
const Shop = require("../model/shop");
const Category = require("../model/Category");
const Subcategory = require("../model/Subcategory");
const Fuse = require("fuse.js");

// Search products with fuzzy search
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

    const filterQuery = {};

    if (category) {
      filterQuery.category = category;
    }

    if (minPrice || maxPrice) {
      filterQuery.discountPrice = {};
      if (minPrice) filterQuery.discountPrice.$gte = Number(minPrice);
      if (maxPrice) filterQuery.discountPrice.$lte = Number(maxPrice);
    }

    if (rating) {
      filterQuery.ratings = { $gte: Number(rating) };
    }

    // Get products first based on filters
    let products = await Product.find(filterQuery)
      .populate("category")
      .populate("subcategory");

    // Fuzzy Search
    if (keyword) {
      const fuse = new Fuse(products, {
        keys: [
          "name",
          "description",
          "tags",
          "category.name",
          "subcategory.name",
        ],
        threshold: 0.4, // lower = stricter, higher = more fuzzy
        ignoreLocation: true,
      });

      const results = fuse.search(keyword);
      products = results.map((r) => r.item);
    }

    // Sorting
    products.sort((a, b) => {
      if (sortOrder === "desc") {
        return b[sortBy] > a[sortBy] ? 1 : -1;
      } else {
        return a[sortBy] > b[sortBy] ? 1 : -1;
      }
    });

    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedProducts = products.slice(
      startIndex,
      startIndex + Number(limit)
    );

    res.status(200).json({
      success: true,
      products: paginatedProducts,
      total: products.length,
      currentPage: Number(page),
      totalPages: Math.ceil(products.length / limit),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Search shops
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

    const query = {};

    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
        { address: { $regex: keyword, $options: "i" } },
      ];
    }

    if (minRating) {
      query.ratings = { $gte: Number(minRating) };
    }

    const skip = (page - 1) * limit;

    const shops = await Shop.find(query)
      .select("-password -resetPasswordToken -resetPasswordTime")
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .skip(skip)
      .limit(Number(limit));

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