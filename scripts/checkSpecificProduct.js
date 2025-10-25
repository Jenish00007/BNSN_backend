const mongoose = require('mongoose');
const Product = require('../model/product');

// Database connection string
const DB_URI = process.env.MONGODB_URI || "mongodb+srv://qaudsinfo:Qauds123@cluster0.nyfuhwt.mongodb.net/qauds?retryWrites=true&w=majority&appName=Cluster0";

async function checkSpecificProduct() {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect(DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Database connected successfully!');

    // Check for the specific product ID from the user's JSON
    const specificProductId = "6858262b5b5d0a8a9a8a6825";
    const product = await Product.findById(specificProductId);
    
    if (product) {
      console.log('\n🎯 Found the specific product:');
      console.log('Product ID:', product._id);
      console.log('Name:', product.name);
      console.log('Unit:', product.unit);
      console.log('Unit Count:', product.unitCount);
      console.log('Stock:', product.stock);
      console.log('All fields:', Object.keys(product.toObject()));
      
      // Check if unit and unitCount are properly set
      console.log('\n📊 Field Status:');
      console.log('unit exists:', product.unit !== undefined);
      console.log('unit value:', product.unit);
      console.log('unitCount exists:', product.unitCount !== undefined);
      console.log('unitCount value:', product.unitCount);
    } else {
      console.log('\n❌ Product not found with ID:', specificProductId);
      
      // Show all products to see what's available
      console.log('\n📋 All available products:');
      const allProducts = await Product.find({});
      allProducts.forEach((prod, index) => {
        console.log(`${index + 1}. ${prod.name} (ID: ${prod._id})`);
        console.log(`   Unit: ${prod.unit}, UnitCount: ${prod.unitCount}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the function
checkSpecificProduct(); 