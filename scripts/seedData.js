require('dotenv').config({
  path: "config/.env",
});
const mongoose = require('mongoose');
const User = require('../model/user');
const Shop = require('../model/shop');
const Product = require('../model/product');
const Event = require('../model/event');
const CouponCode = require('../model/coupounCode');
const Order = require('../model/order');
const Conversation = require('../model/conversation');
const Message = require('../model/messages');
const Withdraw = require('../model/withdraw');

const MONGODB_URI = "mongodb+srv://qaudsinfo:Qauds123@cluster0.nyfuhwt.mongodb.net/qauds?retryWrites=true&w=majority&appName=Cluster0";

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB for seeding'))
.catch(err => console.error('MongoDB connection error:', err));

// Sample data for each model
const seedData = async () => {
  try {
    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Shop.deleteMany({}),
      Product.deleteMany({}),
      Event.deleteMany({}),
      CouponCode.deleteMany({}),
      Order.deleteMany({}),
      Conversation.deleteMany({}),
      Message.deleteMany({}),
      Withdraw.deleteMany({})
    ]);

    // Create sample users
    const users = await User.insertMany([
      {
        name: "John Doe",
        email: "john@example.com",
        password: "$2a$10$YourHashedPasswordHere", // This should be properly hashed
        avatar: "https://example.com/avatar1.jpg",
        role: "user"
      },
      {
        name: "Jane Smith",
        email: "jane@example.com",
        password: "$2a$10$E1dcTwF/6UdWCofMImQjJ.LZo23bWvpPY8jHMCfdh9NKp8TgGbuu2", // Jenish@2000 hashed
        avatar: "https://example.com/avatar2.jpg",
        role: "seller"
      }
    ]);

    // Create sample shops
    const shops = await Shop.insertMany([
      {
        name: "Fashion Store",
        description: "Your one-stop fashion destination",
        address: "123 Fashion Street",
        phoneNumber: "1234567890",
        email: "fashion@store.com",
        zipCode: "12345",
        avatar: "https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg",
        owner: users[1]._id,
        password: "$2a$10$E1dcTwF/6UdWCofMImQjJ.LZo23bWvpPY8jHMCfdh9NKp8TgGbuu2", // Jenish@2000 hashed
        featured: true,
        location: {
          type: "Point",
          coordinates: [-73.935242, 40.730610] // New York coordinates
        }
      },
      {
        name: "Tech Gadgets",
        description: "Latest tech gadgets and accessories",
        address: "456 Tech Avenue",
        phoneNumber: "0987654321",
        email: "tech@gadgets.com",
        zipCode: "54321",
        avatar: "https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg",
        owner: users[1]._id,
        password: "$2a$10$E1dcTwF/6UdWCofMImQjJ.LZo23bWvpPY8jHMCfdh9NKp8TgGbuu2", // Jenish@2000 hashed
        featured: true,
        location: {
          type: "Point",
          coordinates: [-122.419416, 37.774929] // San Francisco coordinates
        }
      },
      {
        name: "Home Decor",
        description: "Beautiful home decoration items",
        address: "789 Home Street",
        phoneNumber: "5555555555",
        email: "home@decor.com",
        zipCode: "67890",
        avatar: "https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg",
        owner: users[1]._id,
        password: "$2a$10$E1dcTwF/6UdWCofMImQjJ.LZo23bWvpPY8jHMCfdh9NKp8TgGbuu2", // Jenish@2000 hashed
        featured: true,
        location: {
          type: "Point",
          coordinates: [-87.629798, 41.878113] // Chicago coordinates
        }
      },
      {
        name: "Sports Equipment",
        description: "Quality sports and fitness equipment",
        address: "321 Sports Lane",
        phoneNumber: "4444444444",
        email: "sports@equipment.com",
        zipCode: "13579",
        avatar: "https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg",
        owner: users[1]._id,
        password: "$2a$10$E1dcTwF/6UdWCofMImQjJ.LZo23bWvpPY8jHMCfdh9NKp8TgGbuu2", // Jenish@2000 hashed
        featured: false,
        location: {
          type: "Point",
          coordinates: [-118.243685, 34.052234] // Los Angeles coordinates
        }
      }
    ]);

    // Create sample products
    const products = await Product.insertMany([
      {
        name: "Summer Dress",
        description: "Beautiful summer dress",
        category: "Fashion",
        tags: "dress, summer, women",
        originalPrice: 99.99,
        discountPrice: 79.99,
        stock: 100,
        images: ["https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg"],
        shopId: shops[0]._id,
        shop: shops[0]._id
      },
      {
        name: "Smart Watch",
        description: "Latest smart watch with health features",
        category: "Electronics",
        tags: "watch, smart, tech",
        originalPrice: 299.99,
        discountPrice: 249.99,
        stock: 50,
        images: ["https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg"],
        shopId: shops[1]._id,
        shop: shops[1]._id
      }
    ]);

    // Create sample events
    const events = await Event.insertMany([
      {
        name: "Summer Sale",
        description: "Big summer sale event",
        category: "Sale",
        start_Date: new Date(),
        Finish_Date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: "Running",
        tags: "sale, summer, discount",
        originalPrice: 199.99,
        discountPrice: 149.99,
        stock: 200,
        images: ["https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg"],
        shopId: shops[0]._id,
        shop: shops[0]._id
      }
    ]);

    // Create sample coupon codes
    const coupons = await CouponCode.insertMany([
      {
        name: "SUMMER2024",
        value: 20,
        minAmount: 100,
        maxAmount: 1000,
        shopId: shops[0]._id,
        selectedProduct: products[0]._id
      }
    ]);

    // Create sample orders
    const orders = await Order.insertMany([
      {
        cart: [
          {
            _id: products[0]._id,
            name: products[0].name,
            price: products[0].discountPrice,
            quantity: 2
          }
        ],
        shippingAddress: {
          address: "123 Customer Street",
          city: "Customer City",
          country: "Customer Country",
          zipCode: "12345"
        },
        user: users[0]._id,
        totalPrice: products[0].discountPrice * 2,
        status: "Processing"
      }
    ]);

    // Create sample conversations
    const conversations = await Conversation.insertMany([
      {
        groupTitle: "Order #12345",
        members: [users[0]._id, users[1]._id],
        lastMessage: "When will my order be delivered?",
        lastMessageId: "msg123"
      }
    ]);

    // Create sample messages
    const messages = await Message.insertMany([
      {
        conversationId: conversations[0]._id,
        text: "When will my order be delivered?",
        sender: users[0]._id
      }
    ]);

    // Create sample withdraws
    const withdraws = await Withdraw.insertMany([
      {
        seller: users[1]._id,
        amount: 500,
        status: "Processing",
        bankInfo: {
          bankName: "Sample Bank",
          accountNumber: "1234567890",
          accountHolderName: "Jane Smith"
        }
      }
    ]);

    console.log('Sample data inserted successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

// Run the seed function
seedData(); 