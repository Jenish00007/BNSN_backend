const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./model/user');

async function resetPassword() {
  try {
    // Connect to database
    await mongoose.connect('mongodb+srv://bnsninfo7_db_user:9IIszB9YaGepoLJ7@cluster0.fjkp50p.mongodb.net/?appName=Cluster0');
    console.log('✅ Connected to database');

    // Find user
    const user = await User.findOne({ email: 'hemantr128@gmail.com' });
    
    if (user) {
      // Set password to known value for testing
      user.password = 'Hem@2000';
      await user.save();
      console.log('✅ Password reset to Hem@2000');
    } else {
      console.log('❌ User not found');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

resetPassword();
