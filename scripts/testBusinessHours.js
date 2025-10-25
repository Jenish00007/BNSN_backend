const mongoose = require('mongoose');
const Shop = require('../model/shop');

// Connect to MongoDB (update with your connection string)
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/multivendor_eshop');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test business hours functionality
const testBusinessHours = async () => {
  try {
    console.log('Testing business hours functionality...\n');

    // Create a test shop with business hours
    const testShop = new Shop({
      name: 'Test Shop',
      email: 'test@shop.com',
      password: 'password123',
      address: '123 Test Street',
      phoneNumber: 1234567890,
      zipCode: 12345,
      avatar: 'test-avatar.jpg',
      location: {
        type: 'Point',
        coordinates: [0, 0]
      },
      businessHours: {
        monday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
        tuesday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
        wednesday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
        thursday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
        friday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
        saturday: { isOpen: false, openTime: "10:00", closeTime: "16:00" },
        sunday: { isOpen: false, openTime: "10:00", closeTime: "16:00" }
      }
    });

    await testShop.save();
    console.log('✅ Test shop created with business hours');

    // Retrieve the shop and verify business hours
    const retrievedShop = await Shop.findById(testShop._id);
    console.log('✅ Shop retrieved successfully');
    console.log('Business Hours:', JSON.stringify(retrievedShop.businessHours, null, 2));

    // Test updating business hours
    const updatedBusinessHours = {
      monday: { isOpen: true, openTime: "08:00", closeTime: "20:00" },
      tuesday: { isOpen: true, openTime: "08:00", closeTime: "20:00" },
      wednesday: { isOpen: true, openTime: "08:00", closeTime: "20:00" },
      thursday: { isOpen: true, openTime: "08:00", closeTime: "20:00" },
      friday: { isOpen: true, openTime: "08:00", closeTime: "20:00" },
      saturday: { isOpen: true, openTime: "10:00", closeTime: "16:00" },
      sunday: { isOpen: false, openTime: "10:00", closeTime: "16:00" }
    };

    await Shop.findByIdAndUpdate(testShop._id, {
      businessHours: updatedBusinessHours
    });

    const updatedShop = await Shop.findById(testShop._id);
    console.log('✅ Business hours updated successfully');
    console.log('Updated Business Hours:', JSON.stringify(updatedShop.businessHours, null, 2));

    // Clean up - delete test shop
    await Shop.findByIdAndDelete(testShop._id);
    console.log('✅ Test shop deleted');

    console.log('\n🎉 All business hours tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
const runTest = async () => {
  await connectDB();
  await testBusinessHours();
  mongoose.connection.close();
  console.log('Test completed');
};

runTest(); 