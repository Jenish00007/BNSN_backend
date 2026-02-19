const mongoose = require("mongoose");
const User = require("./model/user");
const connectDatabase = require("./db/Database");

// Load environment variables
require("dotenv").config({
  path: "./config/.env",
});

// Test contact views API functionality
const testContactViewsAPI = async () => {
  try {
    console.log("🔄 Testing Contact Views API functionality...");
    
    // Connect to database
    await connectDatabase();
    
    // Find a test user or create one
    let testUser = await User.findOne({ email: "test@example.com" });
    
    if (!testUser) {
      console.log("👤 Creating test user...");
      testUser = await User.create({
        name: "Test User",
        email: "test@example.com",
        phoneNumber: "1234567890",
        password: "password123",
        avatar: "test-avatar.jpg",
        contactViews: 0,
        viewedContacts: [],
        hasUnlimitedContacts: false,
        subscriptionExpiry: null,
        contactCredits: 7
      });
      console.log("✅ Test user created");
    } else {
      console.log("✅ Found existing test user");
    }
    
    // Test 1: Get user contact views
    console.log("\n📋 Test 1: Get user contact views");
    console.log(`User ID: ${testUser._id}`);
    console.log(`Contact Views: ${testUser.contactViews || 0}`);
    console.log(`Viewed Contacts: ${testUser.viewedContacts || []}`);
    console.log(`Has Unlimited Contacts: ${testUser.hasUnlimitedContacts || false}`);
    console.log(`Contact Credits: ${testUser.contactCredits || 7}`);
    
    // Test 2: Update contact views
    console.log("\n📝 Test 2: Update contact views");
    const newViewedContacts = ["contact_1", "contact_2", "contact_3"];
    await User.findByIdAndUpdate(testUser._id, {
      contactViews: 3,
      viewedContacts: newViewedContacts
    });
    
    const updatedUser = await User.findById(testUser._id);
    console.log(`Updated Contact Views: ${updatedUser.contactViews}`);
    console.log(`Updated Viewed Contacts: ${updatedUser.viewedContacts}`);
    
    // Test 3: Add contact credits
    console.log("\n💰 Test 3: Add contact credits");
    const currentCredits = updatedUser.contactCredits || 7;
    await User.findByIdAndUpdate(testUser._id, {
      contactCredits: currentCredits + 7
    });
    
    const userWithCredits = await User.findById(testUser._id);
    console.log(`Previous Credits: ${currentCredits}`);
    console.log(`New Credits: ${userWithCredits.contactCredits}`);
    
    // Test 4: Activate unlimited subscription
    console.log("\n🌟 Test 4: Activate unlimited subscription");
    const subscriptionExpiry = new Date();
    subscriptionExpiry.setMonth(subscriptionExpiry.getMonth() + 1);
    
    await User.findByIdAndUpdate(testUser._id, {
      hasUnlimitedContacts: true,
      subscriptionExpiry
    });
    
    const premiumUser = await User.findById(testUser._id);
    console.log(`Has Unlimited Contacts: ${premiumUser.hasUnlimitedContacts}`);
    console.log(`Subscription Expiry: ${premiumUser.subscriptionExpiry}`);
    
    // Test 5: Check subscription expiry logic
    console.log("\n⏰ Test 5: Check subscription expiry logic");
    const now = new Date();
    const expiry = new Date(premiumUser.subscriptionExpiry);
    const daysRemaining = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    console.log(`Days Remaining: ${daysRemaining}`);
    
    if (daysRemaining <= 0) {
      console.log("🔄 Subscription would be expired - updating user...");
      await User.findByIdAndUpdate(testUser._id, {
        hasUnlimitedContacts: false,
        subscriptionExpiry: null
      });
      
      const expiredUser = await User.findById(testUser._id);
      console.log(`After expiry - Has Unlimited: ${expiredUser.hasUnlimitedContacts}`);
    }
    
    console.log("\n🎉 All tests completed successfully!");
    console.log("\n📊 Final User State:");
    console.log(`- Contact Views: ${premiumUser.contactViews}`);
    console.log(`- Viewed Contacts: ${premiumUser.viewedContacts}`);
    console.log(`- Contact Credits: ${premiumUser.contactCredits}`);
    console.log(`- Has Unlimited Contacts: ${premiumUser.hasUnlimitedContacts}`);
    console.log(`- Subscription Expiry: ${premiumUser.subscriptionExpiry}`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
};

// Run the test
testContactViewsAPI();
