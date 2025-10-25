const express = require("express");
const router = express.Router();
const { searchProducts, searchShops } = require("../controller/searchController");

// Search products route
router.get("/products", searchProducts);

// Search shops route
router.get("/shops", searchShops);

module.exports = router; 