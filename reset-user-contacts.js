const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/bsns', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Update the user document
    const result = await mongoose.connection.db.collection('users').updateOne(
      { _id: new mongoose.Types.ObjectId('68ff82f0f76b6a48055b3f74') },
      {
        $set: {
          contactCredits: 0,
          contactViews: 0,
          viewedContacts: []
        }
      }
    );
    
    console.log('Update result:', result);
    
    if (result.matchedCount > 0) {
      console.log('✅ User contact data reset successfully');
      
      // Verify the update
      const user = await mongoose.connection.db.collection('users').findOne(
        { _id: new mongoose.Types.ObjectId('68ff82f0f76b6a48055b3f74') }
      );
      
      console.log('Updated user data:', {
        contactCredits: user.contactCredits,
        contactViews: user.contactViews,
        viewedContacts: user.viewedContacts
      });
    } else {
      console.log('❌ User not found');
    }
    
  } catch (error) {
    console.error('Error updating user:', error);
  }
  
  mongoose.connection.close();
}).catch(err => {
  console.error('MongoDB connection error:', err);
});
