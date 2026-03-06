require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./model/user");
const Shop = require("./model/shop");

async function fixFCMTokens() {
  try {
    console.log("🔧 FIXING FCM TOKENS");
    console.log("=" .repeat(50));
    console.log("This script will clear old/invalid FCM tokens");
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://bnsninfo7_db_user:9IIszB9YaGepoLJ7@cluster0.fjkp50p.mongodb.net/?appName=Cluster0");
    console.log("✅ Connected to database");
    
    // Step 1: Show current tokens
    console.log("\n📊 CURRENT FCM TOKENS");
    console.log("-" .repeat(30));
    
    const usersWithTokens = await User.find({ 
      pushToken: { $exists: true, $ne: null, $ne: "", $ne: "undefined" } 
    });
    
    const shopsWithTokens = await Shop.find({ 
      pushToken: { $exists: true, $ne: null, $ne: "", $ne: "undefined" } 
    });
    
    console.log(`Users with tokens: ${usersWithTokens.length}`);
    console.log(`Shops with tokens: ${shopsWithTokens.length}`);
    
    if (usersWithTokens.length > 0) {
      console.log("\n👤 User tokens:");
      usersWithTokens.forEach(user => {
        console.log(`   - ${user.name || user.email}: ${user.pushToken?.substring(0, 30)}...`);
      });
    }
    
    if (shopsWithTokens.length > 0) {
      console.log("\n🏪 Shop tokens:");
      shopsWithTokens.forEach(shop => {
        console.log(`   - ${shop.name}: ${shop.pushToken?.substring(0, 30)}...`);
      });
    }
    
    // Step 2: Clear all existing tokens
    console.log("\n🗑️  CLEARING OLD TOKENS");
    console.log("-" .repeat(30));
    
    const userUpdateResult = await User.updateMany(
      { pushToken: { $exists: true } },
      { $unset: { pushToken: "" } }
    );
    
    const shopUpdateResult = await Shop.updateMany(
      { pushToken: { $exists: true } },
      { $unset: { pushToken: "" } }
    );
    
    console.log(`✅ Cleared tokens from ${userUpdateResult.modifiedCount} users`);
    console.log(`✅ Cleared tokens from ${shopUpdateResult.modifiedCount} shops`);
    
    // Step 3: Verify tokens are cleared
    console.log("\n🔍 VERIFYING TOKENS CLEARED");
    console.log("-" .repeat(30));
    
    const usersAfter = await User.find({ 
      pushToken: { $exists: true, $ne: null, $ne: "", $ne: "undefined" } 
    });
    
    const shopsAfter = await Shop.find({ 
      pushToken: { $exists: true, $ne: null, $ne: "", $ne: "undefined" } 
    });
    
    console.log(`Users with tokens after clear: ${usersAfter.length}`);
    console.log(`Shops with tokens after clear: ${shopsAfter.length}`);
    
    // Step 4: Instructions
    console.log("\n📝 NEXT STEPS");
    console.log("-" .repeat(30));
    console.log("✅ All old FCM tokens have been cleared");
    console.log("💡 Users need to re-login to register new FCM tokens");
    console.log("💡 New tokens will be generated from the correct Firebase project");
    console.log("💡 Chat notifications should work after users login again");
    
    console.log("\n🎯 EXPECTED FLOW:");
    console.log("1. User opens app and logs in");
    console.log("2. App requests FCM token from Firebase");
    console.log("3. App sends token to backend during login");
    console.log("4. Backend saves token to database");
    console.log("5. Chat messages trigger FCM notifications");
    console.log("6. User receives notifications on device");
    
    await mongoose.connection.close();
    console.log("\n✅ FCM token fix completed");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  }
}

fixFCMTokens();
