const User = require("../model/user");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

// GET user contact views
exports.getUserContactViews = catchAsyncErrors(async (req, res, next) => {
  const { userId } = req.params;

  const user = await User.findById(userId);

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Check if subscription has expired
  let hasUnlimitedContacts = user.hasUnlimitedContacts || false;
  if (user.hasUnlimitedContacts && user.subscriptionExpiry) {
    const now = new Date();
    const expiry = new Date(user.subscriptionExpiry);

    if (now > expiry) {
      // Subscription expired, update user
      await User.findByIdAndUpdate(userId, {
        hasUnlimitedContacts: false,
        subscriptionExpiry: null,
      });
      hasUnlimitedContacts = false;
    }
  }

  res.status(200).json({
    success: true,
    contactViews: user.contactViews || 0,
    viewedContacts: user.viewedContacts || [],
    hasUnlimitedContacts,
    subscriptionExpiry: user.subscriptionExpiry,
    contactCredits: user.contactCredits || 7,
  });
});

// PUT user contact views
// This endpoint is called whenever the user views a contact.
// It ensures that:
// - Each unique contact ID is stored in viewedContacts
// - contactViews is kept in sync with viewedContacts.length
// - contactCredits are reduced only for NEW unique contacts (and only when not unlimited)
exports.updateUserContactViews = catchAsyncErrors(async (req, res, next) => {
  const { userId } = req.params;
  const { contactViews, viewedContacts } = req.body;

  // Load current user so we can calculate deltas safely
  const existingUser = await User.findById(userId);

  if (!existingUser) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Normalize previous and incoming viewedContacts as unique string IDs
  const previousViewed = Array.isArray(existingUser.viewedContacts)
    ? [
        ...new Set(existingUser.viewedContacts.map((id) => id?.toString())),
      ].filter(Boolean)
    : [];

  const incomingViewedRaw = Array.isArray(viewedContacts)
    ? viewedContacts
    : existingUser.viewedContacts || [];

  const incomingViewed = [
    ...new Set(incomingViewedRaw.map((id) => id?.toString())),
  ].filter(Boolean);

  // Contacts that are truly NEW in this update (were not in DB before)
  const newlyAddedIds = incomingViewed.filter(
    (id) => !previousViewed.includes(id),
  );
  const newlyAddedCount = newlyAddedIds.length;

  // Final viewedContacts in DB = union of previous + incoming
  const finalViewed = [...new Set([...previousViewed, ...incomingViewed])];

  // Build the update payload
  const updatePayload = {
    contactViews: finalViewed.length,
    viewedContacts: finalViewed,
  };

  // If user is NOT on unlimited subscription, reduce credits
  if (!existingUser.hasUnlimitedContacts && newlyAddedCount > 0) {
    const currentCredits =
      typeof existingUser.contactCredits === "number"
        ? existingUser.contactCredits
        : 7;

    const updatedCredits = Math.max(0, currentCredits - newlyAddedCount);
    updatePayload.contactCredits = updatedCredits;
  }

  const updatedUser = await User.findByIdAndUpdate(userId, updatePayload, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    contactViews: updatedUser.contactViews || 0,
    viewedContacts: updatedUser.viewedContacts || [],
    contactCredits: updatedUser.contactCredits,
  });
});

// POST reset contact views and credits
exports.resetContactViews = catchAsyncErrors(async (req, res, next) => {
  const { userId } = req.body;

  if (!userId) {
    return next(new ErrorHandler("Please provide userId", 400));
  }

  const user = await User.findById(userId);

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Reset all contact-related fields to exact values
  await User.findByIdAndUpdate(userId, {
    $set: {
      contactViews: 0,
      viewedContacts: [],
      contactCredits: 0,
    }
  });

  res.status(200).json({
    success: true,
    message: "Contact views and credits reset successfully",
    contactViews: 0,
    viewedContacts: [],
    contactCredits: 0,
  });
});

// POST add contact credits
exports.addContactCredits = catchAsyncErrors(async (req, res, next) => {
  const { userId, credits, amount, currency } = req.body;

  if (!userId || !credits || !amount) {
    return next(
      new ErrorHandler("Please provide userId, credits, and amount", 400),
    );
  }

  const user = await User.findById(userId);

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Add credits to user
  const updatedCredits = (user.contactCredits || 7) + credits;

  await User.findByIdAndUpdate(userId, {
    contactCredits: updatedCredits,
  });

  res.status(200).json({
    success: true,
    contactCredits: updatedCredits,
    contactViews: user.contactViews,
    message: `${credits} credits added successfully`,
  });
});

// POST activate unlimited contacts subscription
exports.activateUnlimitedSubscription = catchAsyncErrors(
  async (req, res, next) => {
    const { userId, plan, duration } = req.body;

    if (!userId || !plan || !duration) {
      return next(
        new ErrorHandler("Please provide userId, plan, and duration", 400),
      );
    }

    const user = await User.findById(userId);

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // Calculate subscription expiry
    const subscriptionExpiry = new Date();
    if (duration === "monthly") {
      subscriptionExpiry.setMonth(subscriptionExpiry.getMonth() + 1);
    } else if (duration === "yearly") {
      subscriptionExpiry.setFullYear(subscriptionExpiry.getFullYear() + 1);
    } else {
      return next(
        new ErrorHandler("Invalid duration. Use 'monthly' or 'yearly'", 400),
      );
    }

    await User.findByIdAndUpdate(userId, {
      hasUnlimitedContacts: true,
      subscriptionExpiry,
    });

    res.status(200).json({
      success: true,
      hasUnlimitedContacts: true,
      subscriptionExpiry,
      message: "Unlimited contacts subscription activated successfully",
    });
  },
);

// GET subscription status
exports.getSubscriptionStatus = catchAsyncErrors(async (req, res, next) => {
  const { userId } = req.params;

  const user = await User.findById(userId);

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  let hasUnlimitedContacts = user.hasUnlimitedContacts || false;
  let subscriptionExpiry = user.subscriptionExpiry;
  let daysRemaining = 0;

  if (user.hasUnlimitedContacts && user.subscriptionExpiry) {
    const now = new Date();
    const expiry = new Date(user.subscriptionExpiry);
    daysRemaining = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

    // If subscription expired, update user
    if (daysRemaining <= 0) {
      await User.findByIdAndUpdate(userId, {
        hasUnlimitedContacts: false,
        subscriptionExpiry: null,
      });
      hasUnlimitedContacts = false;
      subscriptionExpiry = null;
      daysRemaining = 0;
    }
  }

  res.status(200).json({
    success: true,
    hasUnlimitedContacts,
    subscriptionExpiry,
    daysRemaining,
    contactCredits: user.contactCredits || 7,
    contactViews: user.contactViews || 0,
  });
});
