const mongoose = require('mongoose');
const Product = require('../model/product');

// Database connection string
const DB_URI = process.env.MONGODB_URI || "mongodb+srv://qaudsinfo:Qauds123@cluster0.nyfuhwt.mongodb.net/qauds?retryWrites=true&w=majority&appName=Cluster0";

async function updateProductUnitCount() {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect(DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Database connected successfully!');

    // Find all products that don't have unitCount field or have it as null/undefined
    const productsToUpdate = await Product.find({
      $or: [
        { unitCount: { $exists: false } },
        { unitCount: null },
        { unitCount: undefined }
      ]
    });

    console.log(`Found ${productsToUpdate.length} products that need unitCount update`);

    if (productsToUpdate.length === 0) {
      console.log('✅ All products already have unitCount field. No updates needed.');
      return;
    }

    let updatedCount = 0;
    let errorCount = 0;

    for (const product of productsToUpdate) {
      try {
        // Update the product with unitCount = 1 (default value)
        await Product.findByIdAndUpdate(
          product._id,
          { unitCount: 1 },
          { new: true, runValidators: false }
        );
        
        updatedCount++;
        console.log(`✅ Updated product: ${product.name} (ID: ${product._id})`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Error updating product ${product.name}:`, error.message);
      }
    }

    console.log('\n📊 Update Statistics:');
    console.log('====================');
    console.log(`Total products found: ${productsToUpdate.length}`);
    console.log(`Successfully updated: ${updatedCount}`);
    console.log(`Errors: ${errorCount}`);

    if (updatedCount > 0) {
      console.log('\n🎉 Product unitCount update completed successfully!');
    } else {
      console.log('\n⚠️  No products were updated. Please check the error messages above.');
    }

  } catch (error) {
    console.error('❌ Database connection error:', error.message);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the update if this script is executed directly
if (require.main === module) {
  updateProductUnitCount().catch(console.error);
}

module.exports = {
  updateProductUnitCount
}; 