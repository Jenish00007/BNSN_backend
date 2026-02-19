const mongoose = require("mongoose");
const User = require("../model/user");
const connectDatabase = require("../db/Database");

// Load environment variables
require("dotenv").config({
  path: "../config/.env",
});

// Add contact views fields to existing users
const addContactViewsFields = async () => {
  try {
    console.log("🔄 Starting migration: Add contact views fields to existing users...");
    
    // Connect to database
    await connectDatabase();
    
    // Find all users that don't have the contactViews field
    const usersToUpdate = await User.find({
      $or: [
        { contactViews: { $exists: false } },
        { viewedContacts: { $exists: false } },
        { hasUnlimitedContacts: { $exists: false } },
        { subscriptionExpiry: { $exists: false } },
        { contactCredits: { $exists: false } }
      ]
    });
    
    console.log(`📊 Found ${usersToUpdate.length} users to update`);
    
    if (usersToUpdate.length === 0) {
      console.log("✅ All users already have contact views fields");
      process.exit(0);
    }
    
    // Update each user
    let updatedCount = 0;
    for (const user of usersToUpdate) {
      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            contactViews: user.contactViews || 0,
            viewedContacts: user.viewedContacts || [],
            hasUnlimitedContacts: user.hasUnlimitedContacts || false,
            subscriptionExpiry: user.subscriptionExpiry || null,
            contactCredits: user.contactCredits || 7
          }
        }
      );
      updatedCount++;
      
      if (updatedCount % 100 === 0) {
        console.log(`📈 Updated ${updatedCount}/${usersToUpdate.length} users...`);
      }
    }
    
    console.log(`✅ Successfully updated ${updatedCount} users with contact views fields`);
    console.log("🎉 Migration completed successfully!");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
};

// Run the migration
addContactViewsFields();
