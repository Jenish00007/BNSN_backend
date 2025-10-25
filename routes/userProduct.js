const express = require("express");
const router = express.Router();
const {
  getRecommendedProducts,
  getTopOffers,
  getMostPopularItems,
  getLatestItems,
  getFlashSaleItems,
} = require("../controller/userProductController");

// Get recommended products
router.get("/recommended", getRecommendedProducts);

// Get top offers
router.get("/top-offers", getTopOffers);

// Get most popular items
router.get("/popular", getMostPopularItems);

// Get latest items
router.get("/latest", getLatestItems);

// Get flash sale items
router.get("/flash-sale", getFlashSaleItems);

module.exports = router; 