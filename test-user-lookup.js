const mongoose = require('mongoose');
const User = require('./model/user');

async function testUserLookup() {
  try {
    // Connect to database
    await mongoose.connect('mongodb+srv://bnsninfo7_db_user:9IIszB9YaGepoLJ7@cluster0.fjkp50p.mongodb.net/?appName=Cluster0');
    console.log('✅ Connected to database');

    // Find user
    const user = await User.findOne({ email: 'hemantr128@gmail.com' }).select('+password');
    
    if (user) {
      console.log('✅ User found:');
      console.log('Name:', user.name);
      console.log('Email:', user.email);
      console.log('Phone:', user.phoneNumber);
      console.log('Password exists:', !!user.password);
      console.log('Password (first 20 chars):', user.password ? user.password.substring(0, 20) + '...' : 'N/A');
    } else {
      console.log('❌ User not found');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testUserLookup();
