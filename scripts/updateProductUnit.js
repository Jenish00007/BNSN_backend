const mongoose = require('mongoose');
const Product = require('../model/product');

// Database connection string
const DB_URI = process.env.MONGODB_URI || "mongodb+srv://qaudsinfo:Qauds123@cluster0.nyfuhwt.mongodb.net/qauds?retryWrites=true&w=majority&appName=Cluster0";

async function updateProductUnit() {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect(DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Database connected successfully!');

    // Find all products that don't have unit field or have it as null/undefined
    const productsToUpdate = await Product.find({
      $or: [
        { unit: { $exists: false } },
        { unit: null },
        { unit: undefined }
      ]
    });

    console.log(`Found ${productsToUpdate.length} products that need unit field update`);

    if (productsToUpdate.length === 0) {
      console.log('✅ All products already have unit field. No updates needed.');
      return;
    }

    let updatedCount = 0;
    let errorCount = 0;

    for (const product of productsToUpdate) {
      try {
        // Determine appropriate unit based on product name or set default
        let unit = 'pcs'; // default unit
        
        // Try to determine unit from product name
        const name = product.name.toLowerCase();
        if (name.includes('kg') || name.includes('kilo')) {
          unit = 'kg';
        } else if (name.includes('g') || name.includes('gram')) {
          unit = 'g';
        } else if (name.includes('ml') || name.includes('milliliter')) {
          unit = 'ml';
        } else if (name.includes('ltr') || name.includes('liter')) {
          unit = 'ltr';
        } else if (name.includes('pack')) {
          unit = 'pack';
        } else if (name.includes('250 g')) {
          unit = 'g';
        } else {
          unit = 'pcs'; // default to pieces
        }

        // Update the product with unit field
        await Product.findByIdAndUpdate(
          product._id,
          { unit: unit },
          { new: true, runValidators: false }
        );
        
        updatedCount++;
        console.log(`✅ Updated product: ${product.name} (ID: ${product._id}) - unit: ${unit}`);
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

    // Verify the results
    console.log('\n🔍 Verifying results...');
    const productsWithoutUnit = await Product.find({
      $or: [
        { unit: { $exists: false } },
        { unit: null },
        { unit: undefined }
      ]
    });

    const productsWithUnit = await Product.find({
      unit: { $exists: true, $ne: null }
    });

    console.log(`Products WITHOUT unit after update: ${productsWithoutUnit.length}`);
    console.log(`Products WITH unit after update: ${productsWithUnit.length}`);

    // Show sample updated products
    if (productsWithUnit.length > 0) {
      console.log('\n📋 Sample updated products:');
      productsWithUnit.slice(0, 3).forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} - unit: ${product.unit}, unitCount: ${product.unitCount}`);
      });
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
updateProductUnit(); 