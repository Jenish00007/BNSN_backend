const mongoose = require('mongoose');
const Product = require('../model/product');

// Database connection string
const DB_URI = process.env.MONGODB_URI || "mongodb+srv://qaudsinfo:Qauds123@cluster0.nyfuhwt.mongodb.net/qauds?retryWrites=true&w=majority&appName=Cluster0";

async function fixProductUnitCount() {
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

    // Find all products
    const allProducts = await Product.find({});
    console.log(`📋 Found ${allProducts.length} products to process`);

    let updatedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const product of allProducts) {
      try {
        // Check if product already has unitCount
        if (product.unitCount !== undefined && product.unitCount !== null) {
          console.log(`⏭️  Skipping product: ${product.name} (already has unitCount: ${product.unitCount})`);
          skippedCount++;
          continue;
        }

        // Update the product with unitCount = 1 (default value)
        // Use updateOne to avoid validation issues
        const result = await Product.updateOne(
          { _id: product._id },
          { $set: { unitCount: 1 } }
        );
        
        if (result.modifiedCount > 0) {
          updatedCount++;
          console.log(`✅ Updated product: ${product.name} (ID: ${product._id})`);
        } else {
          console.log(`⚠️  No changes made to product: ${product.name} (ID: ${product._id})`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Error updating product ${product.name}:`, error.message);
      }
    }

    console.log('\n📊 Migration Statistics:');
    console.log('====================');
    console.log(`Total products processed: ${allProducts.length}`);
    console.log(`Successfully updated: ${updatedCount}`);
    console.log(`Skipped (already had unitCount): ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);

    // Verify the results
    console.log('\n🔍 Verifying results...');
    const productsWithoutUnitCount = await Product.find({
      $or: [
        { unitCount: { $exists: false } },
        { unitCount: null },
        { unitCount: undefined }
      ]
    });

    const productsWithUnitCount = await Product.find({
      unitCount: { $exists: true, $ne: null }
    });

    console.log(`Products WITHOUT unitCount after migration: ${productsWithoutUnitCount.length}`);
    console.log(`Products WITH unitCount after migration: ${productsWithUnitCount.length}`);

    if (productsWithoutUnitCount.length === 0) {
      console.log('\n🎉 All products now have unitCount field!');
    } else {
      console.log('\n⚠️  Some products still missing unitCount:');
      productsWithoutUnitCount.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} (ID: ${product._id})`);
      });
    }

    // Test API response
    console.log('\n🧪 Testing API response...');
    const testProduct = await Product.findOne();
    if (testProduct) {
      console.log('Sample product from database:');
      console.log('- Name:', testProduct.name);
      console.log('- unitCount:', testProduct.unitCount);
      console.log('- unit:', testProduct.unit);
      console.log('- All fields:', Object.keys(testProduct.toObject()));
    }

  } catch (error) {
    console.error('❌ Database connection error:', error.message);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the fix if this script is executed directly
if (require.main === module) {
  fixProductUnitCount().catch(console.error);
}

module.exports = {
  fixProductUnitCount
}; 