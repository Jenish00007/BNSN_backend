const mongoose = require("mongoose");
const User = require("./model/user");
require("dotenv").config();

const fixUserIds = async () => {
  try {
    // Connect to MongoDB
    const MONGODB_URI = "mongodb+srv://qaudsinfo:Qauds123@cluster0.nyfuhwt.mongodb.net/qauds?retryWrites=true&w=majority&appName=Cluster0";
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    // Get total user count
    const totalUsers = await User.countDocuments();
    console.log(`Total users in database: ${totalUsers}`);

    // Get users without userId field (using $exists: false)
    const usersWithoutUserIdField = await User.find({ userId: { $exists: false } });
    console.log(`Users without userId field: ${usersWithoutUserIdField.length}`);

    // Get users with userId field
    const usersWithUserIdField = await User.find({ userId: { $exists: true } });
    console.log(`Users with userId field: ${usersWithUserIdField.length}`);

    // If there are users without userId, fix them
    if (usersWithoutUserIdField.length > 0) {
      // Get the highest existing userId
      const lastUser = await User.findOne({}, {}, { sort: { userId: -1 } });
      let nextUserId = lastUser && lastUser.userId ? lastUser.userId + 1 : 1;
      console.log(`Starting userId assignment from: ${nextUserId}`);

      // Update users without userId
      for (const user of usersWithoutUserIdField) {
        try {
          user.userId = nextUserId++;
          await user.save();
          console.log(`Updated user ${user.name} with userId: ${user.userId}`);
        } catch (error) {
          console.error(`Error updating user ${user._id}:`, error);
        }
      }
    }

    // Verify the fix
    const finalUsersWithUserId = await User.countDocuments({ userId: { $exists: true } });
    const finalUsersWithoutUserId = await User.countDocuments({ userId: { $exists: false } });
    
    console.log(`\nFinal results:`);
    console.log(`Users with userId: ${finalUsersWithUserId}`);
    console.log(`Users without userId: ${finalUsersWithoutUserId}`);
    
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Fix failed:", error);
    mongoose.connection.close();
    process.exit(1);
  }
};

fixUserIds();
