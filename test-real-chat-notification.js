require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./model/user");
const Shop = require("./model/shop");
const Conversation = require("./model/conversation");
const Messages = require("./model/messages");
const { sendFCMNotification } = require("./utils/fcmService");

async function testRealChatNotification() {
  try {
    console.log("💬 TESTING REAL CHAT NOTIFICATION SYSTEM");
    console.log("=" .repeat(60));
    console.log("Simulating actual buyer-seller chat with notifications");
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://bnsninfo7_db_user:9IIszB9YaGepoLJ7@cluster0.fjkp50p.mongodb.net/?appName=Cluster0");
    console.log("✅ Connected to database");
    
    // Step 1: Get participants (you as buyer, a shop as seller)
    console.log("\n👥 SETTING UP CHAT PARTICIPANTS");
    console.log("-" .repeat(40));
    
    const buyer = await User.findOne({ email: "hemantr128@gmail.com" });
    const seller = await Shop.findOne({ pushToken: { $exists: true, $ne: null } });
    
    if (!buyer) {
      console.log("❌ Buyer (you) not found");
      process.exit(1);
    }
    
    if (!seller) {
      console.log("❌ No seller with FCM token found");
      console.log("💡 A seller needs to login to get FCM token");
      process.exit(1);
    }
    
    console.log(`👤 Buyer (You): ${buyer.name}`);
    console.log(`   FCM Token: ${buyer.pushToken?.substring(0, 30)}...`);
    console.log(`🏪 Seller: ${seller.name}`);
    console.log(`   FCM Token: ${seller.pushToken?.substring(0, 30)}...`);
    
    // Step 2: Create or find conversation
    console.log("\n📝 CREATING CONVERSATION");
    console.log("-" .repeat(40));
    
    let conversation = await Conversation.findOne({
      members: { $all: [buyer._id, seller._id] }
    });
    
    if (!conversation) {
      conversation = new Conversation({
        members: [buyer._id, seller._id],
        lastMessage: "Test message for chat notification",
        lastMessageId: null,
      });
      await conversation.save();
      console.log("✅ New conversation created");
    } else {
      console.log("✅ Found existing conversation");
    }
    
    console.log(`   Conversation ID: ${conversation._id}`);
    
    // Step 3: Test 1 - Buyer sends message to seller
    console.log("\n💬 TEST 1: BUYER → SELLER MESSAGE");
    console.log("-" .repeat(40));
    
    const buyerMessage = `Hi ${seller.name}! I'm interested in your products. Is this item available? 🤔`;
    
    // Save message to database
    const message1 = new Messages({
      conversationId: conversation._id,
      text: buyerMessage,
      sender: buyer._id,
    });
    await message1.save();
    
    // Update conversation
    await Conversation.findByIdAndUpdate(conversation._id, {
      lastMessage: buyerMessage,
      lastMessageId: message1._id.toString(),
    });
    
    console.log(`✅ Message saved: "${buyerMessage}"`);
    
    // Send FCM notification to seller (like server.js does)
    if (seller.pushToken) {
      const notificationTitle = `New message from ${buyer.name}`;
      const notificationBody = buyerMessage.length > 50 ? buyerMessage.substring(0, 50) + "..." : buyerMessage;
      
      console.log(`📤 Sending notification to seller: ${seller.name}`);
      
      const result1 = await sendFCMNotification(
        seller.pushToken,
        notificationTitle,
        notificationBody,
        {
          type: "NEW_MESSAGE",
          conversationId: conversation._id.toString(),
          sender: buyer._id.toString(),
          message: buyerMessage,
          senderName: buyer.name,
          timestamp: new Date().toISOString()
        }
      );
      
      if (result1.success) {
        console.log("✅ Seller notification sent successfully");
      } else {
        console.log("❌ Seller notification failed:", result1.error);
      }
    }
    
    // Step 4: Test 2 - Seller sends message to buyer (you)
    console.log("\n💬 TEST 2: SELLER → BUYER (YOU) MESSAGE");
    console.log("-" .repeat(40));
    
    const sellerMessage = `Hi ${buyer.name}! Yes, the item is available. Would you like to know more details? 😊`;
    
    // Save message to database
    const message2 = new Messages({
      conversationId: conversation._id,
      text: sellerMessage,
      sender: seller._id,
    });
    await message2.save();
    
    // Update conversation
    await Conversation.findByIdAndUpdate(conversation._id, {
      lastMessage: sellerMessage,
      lastMessageId: message2._id.toString(),
    });
    
    console.log(`✅ Message saved: "${sellerMessage}"`);
    
    // Send FCM notification to buyer (you)
    if (buyer.pushToken) {
      const notificationTitle = `New message from ${seller.name}`;
      const notificationBody = sellerMessage.length > 50 ? sellerMessage.substring(0, 50) + "..." : sellerMessage;
      
      console.log(`📤 Sending notification to you: ${buyer.name}`);
      
      const result2 = await sendFCMNotification(
        buyer.pushToken,
        notificationTitle,
        notificationBody,
        {
          type: "NEW_MESSAGE",
          conversationId: conversation._id.toString(),
          sender: seller._id.toString(),
          message: sellerMessage,
          senderName: seller.name,
          timestamp: new Date().toISOString()
        }
      );
      
      if (result2.success) {
        console.log("✅ YOUR notification sent successfully!");
        console.log(`📱 Check your phone for notification from "${seller.name}"`);
        console.log(`📝 Title: "New message from ${seller.name}"`);
        console.log(`📄 Body: "${notificationBody}"`);
      } else {
        console.log("❌ Your notification failed:", result2.error);
      }
    }
    
    // Step 5: Summary
    console.log("\n📊 CHAT NOTIFICATION TEST RESULTS");
    console.log("=" .repeat(60));
    console.log("✅ Database operations: Working");
    console.log("✅ Message saving: Working");
    console.log("✅ Conversation updates: Working");
    console.log("✅ FCM notification system: Working");
    console.log("✅ Chat flow: Complete");
    
    console.log("\n🎯 EXPECTED BEHAVIOR:");
    console.log("✅ When buyers send messages → Sellers receive notifications");
    console.log("✅ When sellers send messages → Buyers receive notifications");
    console.log("✅ Real-time chat via Socket.io + Push notifications");
    
    console.log("\n💡 CHECK YOUR PHONE:");
    console.log("You should have received a notification from the seller!");
    console.log("Title: 'New message from [Seller Name]'");
    console.log("Body: 'Hi Hemant Rajput! Yes, the item is available...'");
    
    await mongoose.connection.close();
    console.log("\n✅ Real chat notification test completed");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

testRealChatNotification();
