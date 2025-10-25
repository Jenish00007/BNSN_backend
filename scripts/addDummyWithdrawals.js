require('dotenv').config({
  path: "config/.env",
});
const mongoose = require('mongoose');
const Shop = require('../model/shop');
const Withdraw = require('../model/withdraw');

const MONGODB_URI = "mongodb+srv://qaudsinfo:Qauds123@cluster0.nyfuhwt.mongodb.net/qauds?retryWrites=true&w=majority&appName=Cluster0";

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB for adding dummy withdrawals'))
.catch(err => console.error('MongoDB connection error:', err));

const addDummyWithdrawals = async () => {
  try {
    console.log('Starting to add dummy withdrawal requests...');

    // Get all existing shops/sellers
    const shops = await Shop.find({});
    
    if (shops.length === 0) {
      console.log('No shops found in the database. Please create some shops first.');
      return;
    }

    console.log(`Found ${shops.length} shops in the database.`);

    // Clear existing withdrawals
    await Withdraw.deleteMany({});
    console.log('Cleared existing withdrawal requests.');

    const withdrawalStatuses = ['Processing', 'Succeeded', 'Failed'];
    const withdrawalAmounts = [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000];

    // Create dummy withdrawals for each shop
    const withdrawalPromises = shops.map(async (shop, shopIndex) => {
      // Create 2-4 withdrawal requests per shop
      const numWithdrawals = Math.floor(Math.random() * 3) + 2; // 2-4 withdrawals
      
      const shopWithdrawals = [];
      
      for (let i = 0; i < numWithdrawals; i++) {
        const amount = withdrawalAmounts[Math.floor(Math.random() * withdrawalAmounts.length)];
        const status = withdrawalStatuses[Math.floor(Math.random() * withdrawalStatuses.length)];
        
        // Create withdrawal date (within last 30 days)
        const withdrawalDate = new Date();
        withdrawalDate.setDate(withdrawalDate.getDate() - Math.floor(Math.random() * 30));
        
        const withdrawalData = {
          seller: shop._id,
          amount: amount,
          status: status,
          bankName: shop.withdrawMethod?.bankName || 'Sample Bank',
          bankAccountNumber: shop.withdrawMethod?.accountNumber || '1234567890',
          bankIfscCode: shop.withdrawMethod?.ifscCode || 'SAMPLE123',
          paymentMethod: 'Bank Transfer',
          processingFee: Math.floor(amount * 0.02), // 2% processing fee
          createdAt: withdrawalDate,
          updatedAt: status === 'Succeeded' ? new Date(withdrawalDate.getTime() + 24 * 60 * 60 * 1000) : withdrawalDate,
          transactionId: status === 'Succeeded' ? `TRX${Date.now()}${Math.floor(Math.random() * 1000)}` : null
        };

        shopWithdrawals.push(withdrawalData);
      }

      try {
        const createdWithdrawals = await Withdraw.insertMany(shopWithdrawals);
        
        console.log(`✅ Created ${createdWithdrawals.length} withdrawal requests for shop "${shop.name}"`);
        
        createdWithdrawals.forEach((withdrawal, index) => {
          console.log(`   ${index + 1}. ₹${withdrawal.amount} - ${withdrawal.status} (${new Date(withdrawal.createdAt).toLocaleDateString()})`);
        });
        console.log('');

        return createdWithdrawals;
      } catch (error) {
        console.error(`❌ Error creating withdrawals for shop "${shop.name}":`, error.message);
        return [];
      }
    });

    const results = await Promise.all(withdrawalPromises);
    const allWithdrawals = results.flat();
    const totalWithdrawals = allWithdrawals.length;

    console.log(`\n🎉 Successfully created ${totalWithdrawals} withdrawal requests across ${shops.length} shops.`);

    // Show summary by status
    const statusCounts = {};
    allWithdrawals.forEach(withdrawal => {
      statusCounts[withdrawal.status] = (statusCounts[withdrawal.status] || 0) + 1;
    });

    console.log('\n📊 Withdrawal Status Distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} withdrawals`);
    });

    // Show total amount by status
    const amountByStatus = {};
    allWithdrawals.forEach(withdrawal => {
      if (!amountByStatus[withdrawal.status]) {
        amountByStatus[withdrawal.status] = 0;
      }
      amountByStatus[withdrawal.status] += withdrawal.amount;
    });

    console.log('\n💰 Total Amount by Status:');
    Object.entries(amountByStatus).forEach(([status, amount]) => {
      console.log(`   ${status}: ₹${amount.toLocaleString()}`);
    });

    console.log('\n✅ Dummy withdrawal requests added successfully!');
    console.log('💡 You can now test the withdrawal history functionality in the seller app.');

  } catch (error) {
    console.error('❌ Error adding dummy withdrawals:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  }
};

// Run the script
addDummyWithdrawals(); 