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

const { isAuthenticated, authorizeRoles } = require("../middleware/auth");

// GET user contact views
router.get("/contact-views/:userId", getUserContactViews);

// PUT user contact views
router.put("/contact-views/:userId", updateUserContactViews);

// POST reset contact views and credits
router.post("/contact-views/reset", resetContactViews);

// POST add contact credits
router.post("/contact-credits/add", addContactCredits);

// POST activate unlimited contacts subscription
router.post("/subscription/activate", activateUnlimitedSubscription);

// GET subscription status
router.get("/subscription/:userId", getSubscriptionStatus);

module.exports = router;
