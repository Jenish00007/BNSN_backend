const mongoose = require('mongoose');
const Product = require('../model/product');

// Database connection string
const DB_URI = process.env.MONGODB_URI || "mongodb+srv://qaudsinfo:Qauds123@cluster0.nyfuhwt.mongodb.net/qauds?retryWrites=true&w=majority&appName=Cluster0";

async function updateAllProducts() {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect(DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Database connected successfully!');

    // Get all products
    const allProducts = await Product.find({});
    console.log(`📊 Total products in database: ${allProducts.length}`);

    if (allProducts.length === 0) {
      console.log('❌ No products found in database.');
      return;
    }

    let updatedCount = 0;
    let errorCount = 0;

    console.log('\n🔄 Starting product updates...');

    for (const product of allProducts) {
      try {
        const updates = {};
        let needsUpdate = false;

        // Check and set unit field
        if (!product.unit || product.unit === null || product.unit === undefined) {
          // Determine appropriate unit based on product name
          let unit = 'pcs'; // default unit
          
          const name = product.name.toLowerCase();
          if (name.includes('kg') || name.includes('kilo')) {
            unit = 'kg';
          } else if (name.includes('g') || name.includes('gram') || name.includes('250 g')) {
            unit = 'g';
          } else if (name.includes('ml') || name.includes('milliliter')) {
            unit = 'ml';
          } else if (name.includes('ltr') || name.includes('liter')) {
            unit = 'ltr';
          } else if (name.includes('pack')) {
            unit = 'pack';
          } else if (name.includes('lemon') || name.includes('fruit') || name.includes('strawberry')) {
            unit = 'pcs'; // fruits are typically sold by pieces
          } else {
            unit = 'pcs'; // default to pieces
          }
          
          updates.unit = unit;
          needsUpdate = true;
        }

        // Check and set unitCount field
        if (!product.unitCount || product.unitCount === null || product.unitCount === undefined) {
          updates.unitCount = 1; // default unit count
          needsUpdate = true;
        }

        // Check and set maxPurchaseQuantity field if missing
        if (!product.maxPurchaseQuantity || product.maxPurchaseQuantity === null || product.maxPurchaseQuantity === undefined) {
          updates.maxPurchaseQuantity = 20; // default max purchase quantity
          needsUpdate = true;
        }

        // Update the product if needed
        if (needsUpdate) {
          await Product.findByIdAndUpdate(
            product._id,
            updates,
            { new: true, runValidators: false }
          );
          
          updatedCount++;
          console.log(`✅ Updated product: ${product.name} (ID: ${product._id})`);
          if (updates.unit) console.log(`   - Set unit: ${updates.unit}`);
          if (updates.unitCount) console.log(`   - Set unitCount: ${updates.unitCount}`);
          if (updates.maxPurchaseQuantity) console.log(`   - Set maxPurchaseQuantity: ${updates.maxPurchaseQuantity}`);
        } else {
          console.log(`⏭️  Skipped product: ${product.name} (already has all required fields)`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Error updating product ${product.name}:`, error.message);
      }
    }

    console.log('\n📊 Update Statistics:');
    console.log('====================');
    console.log(`Total products processed: ${allProducts.length}`);
    console.log(`Successfully updated: ${updatedCount}`);
    console.log(`Skipped (no changes needed): ${allProducts.length - updatedCount - errorCount}`);
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

    const productsWithoutUnitCount = await Product.find({
      $or: [
        { unitCount: { $exists: false } },
        { unitCount: null },
        { unitCount: undefined }
      ]
    });

    const productsWithoutMaxPurchase = await Product.find({
      $or: [
        { maxPurchaseQuantity: { $exists: false } },
        { maxPurchaseQuantity: null },
        { maxPurchaseQuantity: undefined }
      ]
    });

    console.log(`Products WITHOUT unit after update: ${productsWithoutUnit.length}`);
    console.log(`Products WITHOUT unitCount after update: ${productsWithoutUnitCount.length}`);
    console.log(`Products WITHOUT maxPurchaseQuantity after update: ${productsWithoutMaxPurchase.length}`);

    // Show sample updated products
    console.log('\n📋 Sample products after update:');
    const sampleProducts = await Product.find({}).limit(5);
    sampleProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   Unit: ${product.unit}, UnitCount: ${product.unitCount}, MaxPurchase: ${product.maxPurchaseQuantity}`);
    });

  } catch (error) {
    console.error('❌ Database connection error:', error.message);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the function
updateAllProducts(); 