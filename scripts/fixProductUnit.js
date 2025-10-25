const mongoose = require('mongoose');
const Product = require('../model/product');

// Database connection string
const DB_URI = process.env.MONGODB_URI || "mongodb+srv://qaudsinfo:Qauds123@cluster0.nyfuhwt.mongodb.net/qauds?retryWrites=true&w=majority&appName=Cluster0";

async function fixProductUnit() {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect(DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Database connected successfully!');

    // Get total count of products
    const totalProducts = await Product.countDocuments();
    console.log(`📊 Total products in database: ${totalProducts}`);

    // Find products that don't have unit field or have it as null/undefined
    const productsWithoutUnit = await Product.find({
      $or: [
        { unit: { $exists: false } },
        { unit: null },
        { unit: undefined }
      ]
    });

    console.log(`\n❌ Products WITHOUT unit field: ${productsWithoutUnit.length}`);

    if (productsWithoutUnit.length > 0) {
      console.log('\n📋 Products missing unit field:');
      productsWithoutUnit.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} (ID: ${product._id})`);
      });
    }

    // Find products that DO have unit field
    const productsWithUnit = await Product.find({
      unit: { $exists: true, $ne: null }
    });

    console.log(`\n✅ Products WITH unit field: ${productsWithUnit.length}`);

    if (productsWithUnit.length > 0) {
      console.log('\n📋 Sample products with unit:');
      productsWithUnit.slice(0, 5).forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} - unit: ${product.unit} (ID: ${product._id})`);
      });
    }

    // Check a few random products to see their full structure
    console.log('\n🔍 Sample product structure:');
    const sampleProduct = await Product.findOne();
    if (sampleProduct) {
      console.log('Sample product fields:', Object.keys(sampleProduct.toObject()));
      console.log('Sample product unit value:', sampleProduct.unit);
      console.log('Sample product unitCount value:', sampleProduct.unitCount);
    }

  } catch (error) {
    console.error('❌ Database connection error:', error.message);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the function
fixProductUnit(); 