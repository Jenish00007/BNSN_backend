const mongoose = require("mongoose");
const User = require("./model/user");
require("dotenv").config();

const checkSpecificUser = async () => {
  try {
    // Connect to MongoDB
    const MONGODB_URI = "mongodb+srv://qaudsinfo:Qauds123@cluster0.nyfuhwt.mongodb.net/qauds?retryWrites=true&w=majority&appName=Cluster0";
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    // Check the specific user by email
    const user = await User.findOne({ email: "karunagiri243@gmail.com" });
    console.log("User found:", user ? "Yes" : "No");
    
    if (user) {
      console.log("User details:");
      console.log("- Name:", user.name);
      console.log("- Email:", user.email);
      console.log("- _id:", user._id);
      console.log("- userId:", user.userId);
      console.log("- All fields:", Object.keys(user.toObject()));
    }

    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Check failed:", error);
    mongoose.connection.close();
    process.exit(1);
  }
};

checkSpecificUser();
