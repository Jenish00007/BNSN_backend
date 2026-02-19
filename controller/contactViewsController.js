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
        subscriptionExpiry: null
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
    contactCredits: user.contactCredits || 7
  });
});

// PUT user contact views
exports.updateUserContactViews = catchAsyncErrors(async (req, res, next) => {
  const { userId } = req.params;
  const { contactViews, viewedContacts } = req.body;
  
  const user = await User.findByIdAndUpdate(
    userId,
    { 
      contactViews: contactViews || 0,
      viewedContacts: viewedContacts || []
    },
    { new: true, runValidators: true }
  );
  
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  res.status(200).json({
    success: true,
    contactViews: user.contactViews,
    viewedContacts: user.viewedContacts
  });
});

// POST add contact credits
exports.addContactCredits = catchAsyncErrors(async (req, res, next) => {
  const { userId, credits, amount, currency } = req.body;
  
  if (!userId || !credits || !amount) {
    return next(new ErrorHandler("Please provide userId, credits, and amount", 400));
  }

  const user = await User.findById(userId);
  
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Add credits to user
  const updatedCredits = (user.contactCredits || 7) + credits;
  
  await User.findByIdAndUpdate(userId, {
    contactCredits: updatedCredits
  });

  res.status(200).json({
    success: true,
    contactCredits: updatedCredits,
    contactViews: user.contactViews,
    message: `${credits} credits added successfully`
  });
});

// POST activate unlimited contacts subscription
exports.activateUnlimitedSubscription = catchAsyncErrors(async (req, res, next) => {
  const { userId, plan, duration } = req.body;
  
  if (!userId || !plan || !duration) {
    return next(new ErrorHandler("Please provide userId, plan, and duration", 400));
  }

  const user = await User.findById(userId);
  
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Calculate subscription expiry
  const subscriptionExpiry = new Date();
  if (duration === 'monthly') {
    subscriptionExpiry.setMonth(subscriptionExpiry.getMonth() + 1);
  } else if (duration === 'yearly') {
    subscriptionExpiry.setFullYear(subscriptionExpiry.getFullYear() + 1);
  } else {
    return next(new ErrorHandler("Invalid duration. Use 'monthly' or 'yearly'", 400));
  }
  
  await User.findByIdAndUpdate(userId, {
    hasUnlimitedContacts: true,
    subscriptionExpiry
  });

  res.status(200).json({
    success: true,
    hasUnlimitedContacts: true,
    subscriptionExpiry,
    message: "Unlimited contacts subscription activated successfully"
  });
});

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
        subscriptionExpiry: null
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
    contactViews: user.contactViews || 0
  });
});
