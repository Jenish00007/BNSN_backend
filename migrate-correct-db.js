const mongoose = require("mongoose");
const User = require("./model/user");
require("dotenv").config();

const migrateCorrectDatabase = async () => {
  try {
    // Connect to the correct MongoDB (the one the server is using)
    const MONGODB_URI = "mongodb+srv://bnsninfo7_db_user:9IIszB9YaGepoLJ7@cluster0.fjkp50p.mongodb.net/?appName=Cluster0";
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to correct MongoDB database");

    // Find all users without userId
    const usersWithoutUserId = await User.find({ userId: { $exists: false } });
    console.log(`Found ${usersWithoutUserId.length} users without userId`);

    // Get the highest existing userId (should be none in this case)
    const lastUser = await User.findOne({}, {}, { sort: { userId: -1 } });
    let nextUserId = lastUser && lastUser.userId ? lastUser.userId + 1 : 1;

    console.log(`Starting userId assignment from: ${nextUserId}`);

    // Update users
    for (const user of usersWithoutUserId) {
      try {
        user.userId = nextUserId++;
        await user.save();
        console.log(`Updated user ${user.name} (${user.email}) with userId: ${user.userId}`);
      } catch (error) {
        console.error(`Error updating user ${user._id}:`, error);
      }
    }

    // Verify the migration
    const totalUsers = await User.countDocuments();
    const usersWithUserId = await User.countDocuments({ userId: { $exists: true } });
    const usersWithoutUserIdAfter = await User.countDocuments({ userId: { $exists: false } });
    
    console.log(`\nMigration completed!`);
    console.log(`Total users: ${totalUsers}`);
    console.log(`Users with userId: ${usersWithUserId}`);
    console.log(`Users without userId: ${usersWithoutUserIdAfter}`);
    
    // Show updated users
    console.log("\nUpdated users:");
    const updatedUsers = await User.find().sort({ userId: 1 });
    updatedUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} - userId: ${user.userId}`);
    });
    
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    mongoose.connection.close();
    process.exit(1);
  }
};

migrateCorrectDatabase();
