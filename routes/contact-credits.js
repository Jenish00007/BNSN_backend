const express = require('express');
const router = express.Router();
const User = require('../model/user');

// Add contact credits to user
router.post('/add', async (req, res) => {
  try {
    const { userId, credits, duration, amount, currency, plan } = req.body;

    console.log('Contact credits request received:', { userId, credits, duration, amount, currency, plan });

    // Validate required fields
    if (!userId || !credits) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, credits'
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (duration || 30));

    // Update user's contact credits
    const currentCredits = user.contactCredits || 0;
    const newCredits = currentCredits + credits;

    const updateData = {
      contactCredits: newCredits,
      subscriptionExpiry: expiryDate,
      lastPaymentDate: new Date(),
      lastPaymentAmount: amount || 49,
      lastPaymentPlan: plan || 'contact_credits'
    };

    await User.findByIdAndUpdate(userId, { $set: updateData });

    console.log(`Updated user ${userId}:`, {
      oldCredits: currentCredits,
      newCredits: newCredits,
      expiresOn: expiryDate,
      plan: plan || 'contact_credits'
    });

    res.json({
      success: true,
      message: `Successfully added ${credits} contact credits`,
      contactCredits: newCredits,
      subscriptionExpiry: expiryDate,
      contactViews: user.contactViews || 0,
      plan: plan || 'contact_credits'
    });

  } catch (error) {
    console.error('Error adding contact credits:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add contact credits'
    });
  }
});

// Get user's contact credits and subscription info
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('contactCredits contactViews viewedContacts subscriptionExpiry hasUnlimitedContacts');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if subscription has expired
    const now = new Date();
    const isExpired = user.subscriptionExpiry && new Date(user.subscriptionExpiry) < now;
    
    let contactCredits = user.contactCredits || 7;
    let hasUnlimitedContacts = user.hasUnlimitedContacts || false;

    // Reset credits if expired
    if (isExpired && !hasUnlimitedContacts) {
      contactCredits = 7; // Reset to default
      await User.findByIdAndUpdate(userId, {
        $set: { contactCredits: 7 },
        $unset: { subscriptionExpiry: 1 }
      });
    }

    res.json({
      success: true,
      contactCredits,
      contactViews: user.contactViews || 0,
      viewedContacts: user.viewedContacts || [],
      hasUnlimitedContacts,
      subscriptionExpiry: isExpired ? null : user.subscriptionExpiry
    });

  } catch (error) {
    console.error('Error fetching contact credits:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch contact credits'
    });
  }
});

// Update contact views (when user views a contact)
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { contactViews, viewedContacts } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user's contact views
    await User.findByIdAndUpdate(userId, {
      $set: {
        contactViews: contactViews || 0,
        viewedContacts: viewedContacts || []
      }
    });

    res.json({
      success: true,
      contactViews: contactViews || 0,
      viewedContacts: viewedContacts || [],
      contactCredits: user.contactCredits || 7,
      hasUnlimitedContacts: user.hasUnlimitedContacts || false
    });

  } catch (error) {
    console.error('Error updating contact views:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update contact views'
    });
  }
});

module.exports = router;
