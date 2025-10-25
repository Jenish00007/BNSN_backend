const mongoose = require('mongoose');
const Product = require('../model/product');

// Database connection string
const DB_URI = process.env.MONGODB_URI || "mongodb+srv://qaudsinfo:Qauds123@cluster0.nyfuhwt.mongodb.net/qauds?retryWrites=true&w=majority&appName=Cluster0";

async function findLemonProduct() {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect(DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Database connected successfully!');

    // Search for Lemon product
    const lemonProduct = await Product.findOne({ name: { $regex: /lemon/i } });
    
    if (lemonProduct) {
      console.log('\n🍋 Found Lemon product:');
      console.log('Product ID:', lemonProduct._id);
      console.log('Name:', lemonProduct.name);
      console.log('Unit:', lemonProduct.unit);
      console.log('Unit Count:', lemonProduct.unitCount);
      console.log('Stock:', lemonProduct.stock);
      console.log('All fields:', Object.keys(lemonProduct.toObject()));
      
      // Check if unit and unitCount are properly set
      console.log('\n📊 Field Status:');
      console.log('unit exists:', lemonProduct.unit !== undefined);
      console.log('unit value:', lemonProduct.unit);
      console.log('unitCount exists:', lemonProduct.unitCount !== undefined);
      console.log('unitCount value:', lemonProduct.unitCount);
    } else {
      console.log('\n❌ Lemon product not found');
      
      // Show all products to see what's available
      console.log('\n📋 All available products:');
      const allProducts = await Product.find({});
      allProducts.forEach((prod, index) => {
        console.log(`${index + 1}. ${prod.name} (ID: ${prod._id})`);
        console.log(`   Unit: ${prod.unit}, UnitCount: ${prod.unitCount}`);
      });
    }

    // Also check if there are any products with missing unit/unitCount
    console.log('\n🔍 Checking for products with missing fields...');
    const productsWithoutUnit = await Product.find({
      $or: [
        { unit: { $exists: false } },
        { unit: null },
        { unit: undefined }
      ]
    });

    const productsWithoutUnitCount = await Product.find({
      $or: [
        { unitCount: { $exists: false } },
        { unitCount: null },
        { unitCount: undefined }
      ]
    });

    console.log(`Products without unit: ${productsWithoutUnit.length}`);
    console.log(`Products without unitCount: ${productsWithoutUnitCount.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the function
findLemonProduct(); 