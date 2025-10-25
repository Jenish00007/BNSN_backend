require('dotenv').config({
  path: "config/.env",
});
const mongoose = require('mongoose');
const Shop = require('../model/shop');

const MONGODB_URI = "mongodb+srv://qaudsinfo:Qauds123@cluster0.nyfuhwt.mongodb.net/qauds?retryWrites=true&w=majority&appName=Cluster0";

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB for adding dummy bank details'))
.catch(err => console.error('MongoDB connection error:', err));

// Dummy bank details for different withdrawal methods
const dummyWithdrawalMethods = [
  
  {
    method: 'bank',
    bankName: 'ICICI Bank',
    accountNumber: '1122334455667788',
    accountHolderName: 'Mike Johnson',
    ifscCode: 'ICIC0001122',
    upiId: '',
    paypalEmail: ''
  },
  {
    method: 'upi',
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
    ifscCode: '',
    upiId: 'john.doe@okicici',
    paypalEmail: ''
  }
];

const addDummyBankDetails = async () => {
  try {
    console.log('Starting to add dummy bank details to sellers...');

    // Get all existing shops/sellers
    const shops = await Shop.find({});
    
    if (shops.length === 0) {
      console.log('No shops found in the database. Please create some shops first.');
      return;
    }

    console.log(`Found ${shops.length} shops in the database.`);

    // Update each shop with dummy withdrawal details
    const updatePromises = shops.map(async (shop, index) => {
      // Cycle through different withdrawal methods
      const withdrawalMethod = dummyWithdrawalMethods[index % dummyWithdrawalMethods.length];
      
      // Add some available balance for testing
      const availableBalance = Math.floor(Math.random() * 10000) + 1000; // Random balance between 1000-11000

      const updateData = {
        withdrawMethod: withdrawalMethod,
        availableBalance: availableBalance
      };

      try {
        const updatedShop = await Shop.findByIdAndUpdate(
          shop._id,
          updateData,
          { new: true }
        );

        console.log(`\u2705 Updated shop "${shop.name}" (${shop.email}) with ${withdrawalMethod.method} withdrawal method`);
        console.log(`   Balance: \u20b9${availableBalance.toLocaleString()}`);
        
        if (withdrawalMethod.method === 'bank') {
          console.log(`   Bank: ${withdrawalMethod.bankName}`);
          console.log(`   Account: ****${withdrawalMethod.accountNumber.slice(-4)}`);
        } else if (withdrawalMethod.method === 'upi') {
          console.log(`   UPI: ${withdrawalMethod.upiId}`);
        }
        // Removed PayPal logic
        console.log('');

        return updatedShop;
      } catch (error) {
        console.error(`\u274c Error updating shop "${shop.name}":`, error.message);
        return null;
      }
    });

    const results = await Promise.all(updatePromises);
    const successfulUpdates = results.filter(result => result !== null);

    console.log(`\n🎉 Successfully updated ${successfulUpdates.length} out of ${shops.length} shops with dummy bank details.`);

    // Show summary of different withdrawal methods used
    const methodCounts = {};
    successfulUpdates.forEach(shop => {
      const method = shop.withdrawMethod?.method || 'unknown';
      methodCounts[method] = (methodCounts[method] || 0) + 1;
    });

    console.log('\n📊 Withdrawal Methods Distribution:');
    Object.entries(methodCounts).forEach(([method, count]) => {
      console.log(`   ${method.toUpperCase()}: ${count} shops`);
    });

    console.log('\n✅ Dummy bank details added successfully!');
    console.log('💡 You can now test the withdrawal functionality in the seller app.');

  } catch (error) {
    console.error('❌ Error adding dummy bank details:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  }
};

// Run the script
addDummyBankDetails(); 