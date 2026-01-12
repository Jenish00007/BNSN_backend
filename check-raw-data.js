const mongoose = require("mongoose");
const User = require("./model/user");
require("dotenv").config();

const checkRawData = async () => {
  try {
    // Connect to MongoDB
    const MONGODB_URI = "mongodb+srv://qaudsinfo:Qauds123@cluster0.nyfuhwt.mongodb.net/qauds?retryWrites=true&w=majority&appName=Cluster0";
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    // Get raw collection data (bypassing Mongoose schema)
    const db = mongoose.connection.db;
    const collection = db.collection('users');
    
    // Check the specific user with raw data
    const rawUser = await collection.findOne({ email: "karunagiri243@gmail.com" });
    console.log("Raw user data:");
    console.log(JSON.stringify(rawUser, null, 2));

    // Check a few users with raw data
    const rawUsers = await collection.find({}).limit(3).toArray();
    console.log("\nFirst 3 users raw data:");
    rawUsers.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`- Name: ${user.name}`);
      console.log(`- Email: ${user.email}`);
      console.log(`- userId: ${user.userId}`);
      console.log(`- Has userId field: ${user.hasOwnProperty('userId')}`);
      console.log(`---`);
    });

    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Check failed:", error);
    mongoose.connection.close();
    process.exit(1);
  }
};

checkRawData();
