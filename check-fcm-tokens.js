require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./model/user");
const Shop = require("./model/shop");

async function checkFCMTokens() {
  try {
    console.log("📊 Checking FCM tokens in database...");
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://bnsninfo7_db_user:9IIszB9YaGepoLJ7@cluster0.fjkp50p.mongodb.net/?appName=Cluster0");
    console.log("✅ Connected to database");
    
    // Find users with FCM tokens
    const users = await User.find({ 
      pushToken: { $exists: true, $ne: null, $ne: "" } 
    });
    
    // Find shops with FCM tokens
    const shops = await Shop.find({ 
      pushToken: { $exists: true, $ne: null, $ne: "" } 
    });
    
    console.log(`\n👤 Users with FCM tokens: ${users.length}`);
    users.forEach(user => {
      console.log(`   - ${user.name || user.email}: ${user.pushToken?.substring(0, 30)}...`);
    });
    
    console.log(`\n🏪 Shops with FCM tokens: ${shops.length}`);
    shops.forEach(shop => {
      console.log(`   - ${shop.name}: ${shop.pushToken?.substring(0, 30)}...`);
    });
    
    if (users.length === 0 && shops.length === 0) {
      console.log("\n❌ No FCM tokens found in database!");
      console.log("💡 Users need to register their FCM tokens first");
      console.log("💡 This is likely why notifications are not working");
    } else {
      console.log("\n✅ Found FCM tokens in database");
      console.log("💡 These users should receive notifications");
    }
    
    await mongoose.connection.close();
    console.log("\n✅ Check completed");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

checkFCMTokens();
