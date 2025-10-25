const mongoose = require('mongoose');
const Product = require('../model/product');

const DB_URI = process.env.MONGODB_URI || "mongodb+srv://qaudsinfo:Qauds123@cluster0.nyfuhwt.mongodb.net/qauds?retryWrites=true&w=majority&appName=Cluster0";

async function forceUpdateUnitCount() {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect(DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Database connected successfully!');

    // Update all products, set unitCount: 1
    const result = await Product.updateMany({}, { $set: { unitCount: 1 } });
    console.log(`✅ Updated ${result.modifiedCount} products to have unitCount: 1`);

    // Add sample data for different product sections
    console.log('\n📊 Adding sample data for product sections...');
    
    // Update some products to be "Top Offers" (high discount)
    const topOffersUpdate = await Product.updateMany(
      { originalPrice: { $exists: true, $gt: 0 } },
      { 
        $set: { 
          discountPrice: { $multiply: ["$originalPrice", 0.7] }, // 30% discount
          unitCount: 1 
        } 
      }
    );
    console.log(`✅ Updated ${topOffersUpdate.modifiedCount} products for Top Offers section`);

    // Update some products to be "Most Popular" (high sold_out and ratings)
    const popularUpdate = await Product.updateMany(
      {},
      { 
        $set: { 
          sold_out: Math.floor(Math.random() * 100) + 50, // Random high sales
          ratings: Math.floor(Math.random() * 5) + 4, // Random high ratings
          unitCount: 1 
        } 
      }
    );
    console.log(`✅ Updated ${popularUpdate.modifiedCount} products for Most Popular section`);

    // Update some products to be "Latest" (recent creation)
    const latestUpdate = await Product.updateMany(
      {},
      { 
        $set: { 
          createdAt: new Date(), // Set to current date
          unitCount: 1 
        } 
      }
    );
    console.log(`✅ Updated ${latestUpdate.modifiedCount} products for Latest section`);

    // Verify
    const productsWithUnitCount = await Product.find({ unitCount: 1 });
    console.log(`\n📈 Products with unitCount = 1: ${productsWithUnitCount.length}`);
    
    if (productsWithUnitCount.length > 0) {
      console.log('Sample products by section:');
      
      // Sample Top Offers
      const topOffers = await Product.find({ 
        originalPrice: { $exists: true, $gt: 0 },
        discountPrice: { $exists: true, $gt: 0 }
      }).limit(3);
      console.log('\n🔥 Top Offers:');
      topOffers.forEach((p, i) => {
        const discount = ((p.originalPrice - p.discountPrice) / p.originalPrice * 100).toFixed(1);
        console.log(`${i + 1}. ${p.name} - ${discount}% off (₹${p.originalPrice} → ₹${p.discountPrice})`);
      });

      // Sample Popular Items
      const popularItems = await Product.find({ sold_out: { $gte: 50 } }).sort({ sold_out: -1 }).limit(3);
      console.log('\n⭐ Most Popular Items:');
      popularItems.forEach((p, i) => {
        console.log(`${i + 1}. ${p.name} - ${p.sold_out} sold, ${p.ratings}★ rating`);
      });

      // Sample Latest Items
      const latestItems = await Product.find().sort({ createdAt: -1 }).limit(3);
      console.log('\n🆕 Latest Items:');
      latestItems.forEach((p, i) => {
        console.log(`${i + 1}. ${p.name} - Created: ${p.createdAt.toLocaleDateString()}`);
      });
    }

    console.log('\n✅ All product sections updated successfully!');
    console.log('\n📋 Available API endpoints for testing:');
    console.log('- GET /user-products/top-offers - Top Offers');
    console.log('- GET /user-products/popular - Most Popular Items');
    console.log('- GET /user-products/latest - Latest Products');
    console.log('- GET /user-products/recommended - Recommended Products');
    console.log('- GET /user-products/flash-sale - Flash Sale Items');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

forceUpdateUnitCount(); 