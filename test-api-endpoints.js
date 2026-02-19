const express = require("express");
const mongoose = require("mongoose");
const User = require("./model/user");

// Load environment variables
require("dotenv").config({
  path: "./config/.env",
});

// Test API endpoints directly
const testAPIEndpoints = async () => {
  try {
    console.log("🔄 Testing API endpoints directly...");
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");
    
    // Test 1: Get user contact views (simulating the controller logic)
    console.log("\n📋 Test 1: Get user contact views");
    const userId = "69940381eb4e3198e915e09a"; // Test user ID from previous test
    const user = await User.findById(userId);
    
    if (!user) {
      console.log("❌ User not found");
      return;
    }
    
    // Check if subscription has expired
    let hasUnlimitedContacts = user.hasUnlimitedContacts || false;
    if (user.hasUnlimitedContacts && user.subscriptionExpiry) {
      const now = new Date();
      const expiry = new Date(user.subscriptionExpiry);
      
      if (now > expiry) {
        console.log("⏰ Subscription expired - updating user...");
        await User.findByIdAndUpdate(userId, {
          hasUnlimitedContacts: false,
          subscriptionExpiry: null
        });
        hasUnlimitedContacts = false;
      }
    }
    
    const responseData = {
      success: true,
      contactViews: user.contactViews || 0,
      viewedContacts: user.viewedContacts || [],
      hasUnlimitedContacts,
      subscriptionExpiry: user.subscriptionExpiry,
      contactCredits: user.contactCredits || 7
    };
    
    console.log("✅ API Response:");
    console.log(JSON.stringify(responseData, null, 2));
    
    // Test 2: Update contact views (simulating the controller logic)
    console.log("\n📝 Test 2: Update contact views");
    const newContactViews = 5;
    const newViewedContacts = ["contact_1", "contact_2", "contact_3", "contact_4", "contact_5"];
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        contactViews: newContactViews,
        viewedContacts: newViewedContacts
      },
      { new: true, runValidators: true }
    );
    
    const updateResponse = {
      success: true,
      contactViews: updatedUser.contactViews,
      viewedContacts: updatedUser.viewedContacts
    };
    
    console.log("✅ Update Response:");
    console.log(JSON.stringify(updateResponse, null, 2));
    
    // Test 3: Add contact credits (simulating the controller logic)
    console.log("\n💰 Test 3: Add contact credits");
    const creditsToAdd = 7;
    const amount = 49;
    
    const userBeforeCredits = await User.findById(userId);
    const updatedCredits = (userBeforeCredits.contactCredits || 7) + creditsToAdd;
    
    await User.findByIdAndUpdate(userId, {
      contactCredits: updatedCredits
    });
    
    const creditsResponse = {
      success: true,
      contactCredits: updatedCredits,
      contactViews: userBeforeCredits.contactViews,
      message: `${creditsToAdd} credits added successfully`
    };
    
    console.log("✅ Credits Response:");
    console.log(JSON.stringify(creditsResponse, null, 2));
    
    console.log("\n🎉 All API endpoint tests completed successfully!");
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
};

// Run the test
testAPIEndpoints();
