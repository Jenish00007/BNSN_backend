const mongoose = require("mongoose");
const User = require("./model/user");
require("dotenv").config();

const checkUserIds = async () => {
  try {
    // Connect to MongoDB
    const MONGODB_URI = "mongodb+srv://qaudsinfo:Qauds123@cluster0.nyfuhwt.mongodb.net/qauds?retryWrites=true&w=majority&appName=Cluster0";
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    // Check users without userId
    const usersWithoutUserId = await User.find({ userId: { $exists: false } }).limit(10);
    console.log(`Found ${usersWithoutUserId.length} users without userId (showing first 10):`);
    
    usersWithoutUserId.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - _id: ${user._id}`);
    });

    // Check users with userId
    const usersWithUserId = await User.find({ userId: { $exists: true } }).limit(5);
    console.log(`\nFound users with userId (showing first 5):`);
    
    usersWithUserId.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - userId: ${user.userId}`);
    });

    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Check failed:", error);
    mongoose.connection.close();
    process.exit(1);
  }
};

checkUserIds();
