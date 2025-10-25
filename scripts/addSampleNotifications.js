const mongoose = require('mongoose');
const Notification = require('../model/notification');
const User = require('../model/user');
// MongoDB connection string
const MONGODB_URI = "mongodb+srv://qaudsinfo:Qauds123@cluster0.nyfuhwt.mongodb.net/qauds?retryWrites=true&w=majority&appName=Cluster0";

// Try to load environment variables, but use defaults if not available
try {
  require('dotenv').config({ path: '../config/.env' });
} catch (error) {
  console.log('No .env file found, using default configuration');
}

// Connect to database
const connectDatabase = async () => {
  try {
    // Use default MongoDB URL if not set in environment
    const mongoUrl = MONGODB_URI;
    console.log('Using MongoDB URL:', mongoUrl);
    
    await mongoose.connect(mongoUrl);
    console.log('Connected to database');
  } catch (error) {
    console.error('Database connection error:', error);
    console.log('\nTo fix this error:');
    console.log('1. Make sure MongoDB is running on your system');
    console.log('2. Create a .env file in backend/config/ with MONGODB_URL=your_mongodb_connection_string');
    console.log('3. Or install MongoDB locally and run: mongod');
    process.exit(1);
  }
};

// Sample notifications data
const sampleNotifications = [
  {
    title: "Welcome to Our App!",
    description: "Thank you for joining us. Start exploring our amazing products and services.",
    type: "general",
    data: { welcome: true }
  },
  {
    title: "Special Offer - 20% Off!",
    description: "Get 20% off on your first order. Use code: WELCOME20",
    type: "offer",
    data: { discount: 20, code: "WELCOME20" }
  },
  {
    title: "Order #12345 Confirmed",
    description: "Your order has been confirmed and is being prepared.",
    type: "order",
    data: { orderNumber: "12345", status: "confirmed" }
  },
  {
    title: "Order #12345 Out for Delivery",
    description: "Your order is on its way! Expected delivery in 30 minutes.",
    type: "order",
    data: { orderNumber: "12345", status: "out_for_delivery" }
  },
  {
    title: "New Product Alert",
    description: "Check out our latest arrivals in the electronics section.",
    type: "promotion",
    data: { category: "electronics" }
  },
  {
    title: "Flash Sale - Limited Time!",
    description: "Hurry! Flash sale ends in 2 hours. Up to 50% off on selected items.",
    type: "offer",
    data: { discount: 50, duration: "2 hours" }
  },
  {
    title: "Order #12345 Delivered",
    description: "Your order has been successfully delivered. Enjoy your purchase!",
    type: "order",
    data: { orderNumber: "12345", status: "delivered" }
  },
  {
    title: "App Update Available",
    description: "A new version of the app is available with exciting new features.",
    type: "general",
    data: { update: true }
  }
];

// Function to add sample notifications
const addSampleNotifications = async () => {
  try {
    // Get all users
    const users = await User.find({});
    
    if (users.length === 0) {
      console.log('No users found. Creating a test user...');
      const testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        phoneNumber: '1234567890'
      });
      console.log('Test user created:', testUser.email);
      users.push(testUser);
    }

    console.log(`Found ${users.length} users. Adding sample notifications...`);

    for (const user of users) {
      console.log(`Adding notifications for user: ${user.name} (${user.email})`);
      
      for (const notificationData of sampleNotifications) {
        // Randomize some data for variety
        const randomOrderNumber = Math.floor(Math.random() * 90000) + 10000;
        const modifiedData = {
          ...notificationData,
          description: notificationData.description.replace('12345', randomOrderNumber.toString()),
          data: {
            ...notificationData.data,
            orderNumber: notificationData.data.orderNumber ? randomOrderNumber.toString() : undefined
          }
        };

        await Notification.create({
          user: user._id,
          title: modifiedData.title,
          description: modifiedData.description,
          type: modifiedData.type,
          data: modifiedData.data,
          isRead: Math.random() > 0.5, // Randomly mark some as read
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random date within last 7 days
        });
      }
    }

    console.log('Sample notifications added successfully!');
    
    // Display summary
    const totalNotifications = await Notification.countDocuments();
    const unreadNotifications = await Notification.countDocuments({ isRead: false });
    
    console.log(`\nSummary:`);
    console.log(`Total notifications: ${totalNotifications}`);
    console.log(`Unread notifications: ${unreadNotifications}`);
    
  } catch (error) {
    console.error('Error adding sample notifications:', error);
  }
};

// Main execution
const main = async () => {
  await connectDatabase();
  await addSampleNotifications();
  mongoose.connection.close();
  console.log('Database connection closed');
};

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { addSampleNotifications }; 