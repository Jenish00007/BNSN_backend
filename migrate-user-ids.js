const mongoose = require("mongoose");
const User = require("./model/user");
require("dotenv").config();

const migrateUserIds = async () => {
  try {
    // Connect to MongoDB
    const MONGODB_URI = "mongodb+srv://qaudsinfo:Qauds123@cluster0.nyfuhwt.mongodb.net/qauds?retryWrites=true&w=majority&appName=Cluster0";
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    // Find all users without userId
    const usersWithoutUserId = await User.find({ userId: { $exists: false } });
    console.log(`Found ${usersWithoutUserId.length} users without userId`);

    // Get the highest existing userId
    const lastUser = await User.findOne({}, {}, { sort: { userId: -1 } });
    let nextUserId = lastUser && lastUser.userId ? lastUser.userId + 1 : 1;

    console.log(`Starting userId assignment from: ${nextUserId}`);

    // Update users in batches
    const batchSize = 100;
    let updatedCount = 0;

    for (let i = 0; i < usersWithoutUserId.length; i += batchSize) {
      const batch = usersWithoutUserId.slice(i, i + batchSize);
      
      const updatePromises = batch.map(async (user) => {
        try {
          user.userId = nextUserId++;
          await user.save();
          updatedCount++;
          console.log(`Updated user ${user.name} with userId: ${user.userId}`);
        } catch (error) {
          console.error(`Error updating user ${user._id}:`, error);
        }
      });

      await Promise.all(updatePromises);
      console.log(`Batch ${Math.floor(i / batchSize) + 1} completed. Total updated: ${updatedCount}`);
    }

    console.log(`Migration completed! Updated ${updatedCount} users with userIds.`);
    
    // Verify the migration
    const totalUsers = await User.countDocuments();
    const usersWithUserId = await User.countDocuments({ userId: { $exists: true } });
    
    console.log(`Total users: ${totalUsers}`);
    console.log(`Users with userId: ${usersWithUserId}`);
    
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    mongoose.connection.close();
    process.exit(1);
  }
};

// Run the migration
migrateUserIds();
