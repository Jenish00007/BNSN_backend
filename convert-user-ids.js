const mongoose = require("mongoose");
const User = require("./model/user");
require("dotenv").config();

const convertUserIdsToNumbers = async () => {
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
    
    // Find all users with string userIds
    const usersWithStringIds = await collection.find({ 
      userId: { $type: "string" }
    }).toArray();
    
    console.log(`Found ${usersWithStringIds.length} users with string userIds`);
    
    // Convert string userIds to numbers
    let nextUserId = 1;
    for (const user of usersWithStringIds) {
      try {
        // Extract the number from string like "USR-000312" -> 312
        const stringId = user.userId;
        let numericId;
        
        if (stringId.startsWith("USR-")) {
          numericId = parseInt(stringId.replace("USR-000", "").replace("USR-00", "").replace("USR-0", "").replace("USR-", ""));
        } else {
          // Fallback: use next available number
          numericId = nextUserId++;
        }
        
        // Update the user with numeric userId
        await collection.updateOne(
          { _id: user._id },
          { $set: { userId: numericId } }
        );
        
        console.log(`Updated ${user.name}: ${stringId} -> ${numericId}`);
        
        // Update nextUserId to be higher than any existing numericId
        if (numericId >= nextUserId) {
          nextUserId = numericId + 1;
        }
      } catch (error) {
        console.error(`Error updating user ${user._id}:`, error);
      }
    }
    
    // Verify the conversion
    const usersWithNumericIds = await collection.find({ 
      userId: { $type: "number" }
    }).toArray();
    
    const usersWithStringIdsAfter = await collection.find({ 
      userId: { $type: "string" }
    }).toArray();
    
    console.log(`\nConversion results:`);
    console.log(`Users with numeric userId: ${usersWithNumericIds.length}`);
    console.log(`Users with string userId: ${usersWithStringIdsAfter.length}`);
    
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Conversion failed:", error);
    mongoose.connection.close();
    process.exit(1);
  }
};

convertUserIdsToNumbers();
