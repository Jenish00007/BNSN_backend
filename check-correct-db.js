const mongoose = require("mongoose");
const User = require("./model/user");
require("dotenv").config();

const checkCorrectDatabase = async () => {
  try {
    // Connect to the correct MongoDB (the one the server is using)
    const MONGODB_URI = "mongodb+srv://bnsninfo7_db_user:9IIszB9YaGepoLJ7@cluster0.fjkp50p.mongodb.net/?appName=Cluster0";
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to correct MongoDB database");

    // Get total user count
    const totalUsers = await User.countDocuments();
    console.log(`Total users in database: ${totalUsers}`);

    // Check users with userId field
    const usersWithUserIdField = await User.find({ userId: { $exists: true } });
    console.log(`Users with userId field: ${usersWithUserIdField.length}`);

    // Check users without userId field
    const usersWithoutUserIdField = await User.find({ userId: { $exists: false } });
    console.log(`Users without userId field: ${usersWithoutUserIdField.length}`);

    // Show some examples
    console.log("\nSample users:");
    const sampleUsers = await User.find().limit(3);
    sampleUsers.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`- Name: ${user.name}`);
      console.log(`- Email: ${user.email}`);
      console.log(`- userId: ${user.userId} (type: ${typeof user.userId})`);
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

checkCorrectDatabase();
