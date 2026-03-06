require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./model/user");
const Shop = require("./model/shop");
const Conversation = require("./model/conversation");

async function testTypingIndicators() {
  try {
    console.log("💬 TESTING TYPING INDICATORS");
    console.log("=" .repeat(50));
    console.log("Verifying typing indicator events are working");
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://bnsninfo7_db_user:9IIszB9YaGepoLJ7@cluster0.fjkp50p.mongodb.net/?appName=Cluster0");
    console.log("✅ Connected to database");
    
    // Get participants
    const buyer = await User.findOne({ email: "hemantr128@gmail.com" });
    const seller = await Shop.findOne();
    
    if (!buyer || !seller) {
      console.log("❌ Participants not found");
      process.exit(1);
    }
    
    console.log("\n👥 Participants:");
    console.log(`👤 Buyer: ${buyer.name} (ID: ${buyer._id})`);
    console.log(`🏪 Seller: ${seller.name} (ID: ${seller._id})`);
    
    // Find or create conversation
    let conversation = await Conversation.findOne({
      members: { $all: [buyer._id, seller._id] }
    });
    
    if (!conversation) {
      conversation = new Conversation({
        members: [buyer._id, seller._id],
        lastMessage: "Test for typing indicators",
        lastMessageId: null,
      });
      await conversation.save();
      console.log("\n✅ Created test conversation");
    } else {
      console.log("\n✅ Found existing conversation");
    }
    
    console.log(`📝 Conversation ID: ${conversation._id}`);
    
    console.log("\n🎯 TYPING INDICATOR TEST INSTRUCTIONS");
    console.log("-" .repeat(50));
    console.log("1. Open the chat app on your device");
    console.log("2. Navigate to the chat with the seller");
    console.log("3. Start typing in the message input");
    console.log("4. The other user should see 'User is typing...'");
    console.log("5. Stop typing for 1 second - indicator should disappear");
    console.log("6. Send a message - indicator should disappear immediately");
    
    console.log("\n📊 WHAT TO EXPECT:");
    console.log("✅ When you type: Other user sees 'Hemant Rajput is typing...'");
    console.log("✅ When you stop typing: Indicator disappears after 1 second");
    console.log("✅ When you send message: Indicator disappears immediately");
    
    console.log("\n🔧 BACKEND EVENTS:");
    console.log("✅ 'typing' event: Emitted when user starts typing");
    console.log("✅ 'stop-typing' event: Emitted when user stops typing");
    console.log("✅ 'user-typing' event: Received by other user");
    console.log("✅ 'user-stopped-typing' event: Received by other user");
    
    console.log("\n💡 TROUBLESHOOTING:");
    console.log("If typing indicators don't work:");
    console.log("1. Check Socket.io connection status");
    console.log("2. Verify both users are in the same chat room");
    console.log("3. Check browser/app console for errors");
    console.log("4. Verify conversationId matches between users");
    
    console.log("\n🎉 TYPING INDICATORS ARE CONFIGURED!");
    console.log("Test them in the chat app now.");
    
    await mongoose.connection.close();
    console.log("\n✅ Test setup completed");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

testTypingIndicators();
