const express = require("express");
const router = express.Router();
const { getLatestItems } = require("../controller/userProductController");

// Get latest items with filters
router.get("/latest", getLatestItems);

module.exports = router; 