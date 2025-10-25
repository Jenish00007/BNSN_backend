const express = require("express");
const router = express.Router();
const {
  createBanner,
  getShopBanners,
  updateBanner,
  deleteBanner,
  getBanner
} = require("../controller/shopBannerController");
const { isSeller } = require("../middleware/auth");
const { upload } = require("../multer");

// Create new banner
router.post("/create", isSeller, upload.single("image"), createBanner);

// Get all banners for a shop
router.get("/all",  getShopBanners);

// Get single banner
router.get("/:id", isSeller, getBanner);

// Update banner
router.put("/:id", isSeller, upload.single("image"), updateBanner);

// Delete banner
router.delete("/:id", isSeller, deleteBanner);

module.exports = router; 