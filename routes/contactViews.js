const express = require("express");
const router = express.Router();

const {
  getUserContactViews,
  updateUserContactViews,
  resetContactViews,
  addContactCredits,
  activateUnlimitedSubscription,
  getSubscriptionStatus
} = require("../controller/contactViewsController");

const { isAuthenticated } = require("../middleware/auth");

// GET user contact views (public - needed for initial app load)
router.get("/contact-views/:userId", getUserContactViews);

// PUT user contact views (auth + ownership verified in controller)
router.put("/contact-views/:userId", isAuthenticated, updateUserContactViews);

// POST reset contact views and credits (auth required)
router.post("/contact-views/reset", isAuthenticated, resetContactViews);

// POST add contact credits (auth + payment verification in controller)
router.post("/contact-credits/add", isAuthenticated, addContactCredits);

// POST activate unlimited contacts subscription (auth + ownership in controller)
router.post("/subscription/activate", isAuthenticated, activateUnlimitedSubscription);

// GET subscription status (public - needed for initial app load)
router.get("/subscription/:userId", getSubscriptionStatus);

module.exports = router;
