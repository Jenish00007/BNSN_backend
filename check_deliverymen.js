const mongoose = require('mongoose');
const DeliveryMan = require('./model/deliveryman');

async function checkDeliverymen() {
  try {
    await mongoose.connect('mongodb://localhost:27017/multivendr', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    const deliverymen = await DeliveryMan.find({}).select('name email isApproved isAvailable expoPushToken');
    console.log('Total deliverymen found:', deliverymen.length);
    
    if (deliverymen.length > 0) {
      console.log('\nDeliverymen details:');
      deliverymen.forEach((dm, index) => {
        console.log(`${index + 1}. Name: ${dm.name}`);
        console.log(`   Email: ${dm.email}`);
        console.log(`   Approved: ${dm.isApproved}`);
        console.log(`   Available: ${dm.isAvailable}`);
        console.log(`   FCM Token: ${dm.expoPushToken ? 'Present' : 'Missing'}`);
        if (dm.expoPushToken) {
          console.log(`   Token: ${dm.expoPushToken.substring(0, 20)}...`);
        }
        console.log('');
      });
    } else {
      console.log('No deliverymen found in database');
    }
    
    // Check for available deliverymen with FCM tokens
    const availableDeliverymen = await DeliveryMan.find({
      isAvailable: true,
      isApproved: true,
      expoPushToken: { $exists: true, $ne: null, $ne: '' }
    }).select('name expoPushToken');
    
    console.log('Available deliverymen with FCM tokens:', availableDeliverymen.length);
    
    if (availableDeliverymen.length > 0) {
      console.log('\nAvailable deliverymen with FCM tokens:');
      availableDeliverymen.forEach((dm, index) => {
        console.log(`${index + 1}. Name: ${dm.name}`);
        console.log(`   Token: ${dm.expoPushToken.substring(0, 30)}...`);
      });
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkDeliverymen();

