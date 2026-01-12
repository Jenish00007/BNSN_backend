const mongoose = require("mongoose");
const User = require("./model/user");
require("dotenv").config();

const checkUserIdsDeep = async () => {
  try {
    // Connect to MongoDB
    const MONGODB_URI = "mongodb+srv://qaudsinfo:Qauds123@cluster0.nyfuhwt.mongodb.net/qauds?retryWrites=true&w=majority&appName=Cluster0";
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    // Check users with userId that exists but might be null/undefined
    const usersWithUserIdField = await User.find({ userId: { $exists: true } }).limit(3);
    console.log(`Found ${usersWithUserIdField.length} users with userId field (first 3):`);
    
    usersWithUserIdField.forEach(user => {
      console.log(`- ${user.name}: userId = ${user.userId} (type: ${typeof user.userId})`);
    });

    // Check users without userId field
    const usersWithoutUserIdField = await User.find({ userId: { $exists: false } }).limit(3);
    console.log(`\nFound ${usersWithoutUserIdField.length} users without userId field (first 3):`);
    
    usersWithoutUserIdField.forEach(user => {
      console.log(`- ${user.name}: no userId field`);
    });

    // Check users with null userId
    const usersWithNullUserId = await User.find({ userId: null }).limit(3);
    console.log(`\nFound ${usersWithNullUserId.length} users with null userId (first 3):`);
    
    usersWithNullUserId.forEach(user => {
      console.log(`- ${user.name}: userId = null`);
    });

    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Check failed:", error);
    mongoose.connection.close();
    process.exit(1);
  }
};

checkUserIdsDeep();
