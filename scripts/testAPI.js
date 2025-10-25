const mongoose = require('mongoose');
const Product = require('../model/product');

// Database connection string
const DB_URI = process.env.MONGODB_URI || "mongodb+srv://qaudsinfo:Qauds123@cluster0.nyfuhwt.mongodb.net/qauds?retryWrites=true&w=majority&appName=Cluster0";

async function testAPI() {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect(DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Database connected successfully!');

    // Get all products without populate to avoid model registration issues
    const products = await Product.find({});

    console.log(`📊 Found ${products.length} products`);

    if (products.length > 0) {
      console.log('\n📋 Sample product data (as returned by API):');
      const sampleProduct = products[0];
      
      // Convert to plain object to see all fields
      const productObj = sampleProduct.toObject();
      
      console.log('Product ID:', productObj._id);
      console.log('Name:', productObj.name);
      console.log('Unit:', productObj.unit);
      console.log('Unit Count:', productObj.unitCount);
      console.log('Stock:', productObj.stock);
      console.log('Max Purchase Quantity:', productObj.maxPurchaseQuantity);
      
      console.log('\n🔍 All fields in response:');
      Object.keys(productObj).forEach(field => {
        console.log(`- ${field}: ${productObj[field]}`);
      });

      // Check if unit and unitCount are present
      console.log('\n✅ Field Presence Check:');
      console.log('unit exists:', productObj.hasOwnProperty('unit'));
      console.log('unitCount exists:', productObj.hasOwnProperty('unitCount'));
      console.log('maxPurchaseQuantity exists:', productObj.hasOwnProperty('maxPurchaseQuantity'));
    }

    // Also check if there are any products with the specific shop ID from your JSON
    const shopId = "683fdb32b96623fb63790305";
    const shopProducts = await Product.find({ shopId });

    console.log(`\n🏪 Products for shop ${shopId}: ${shopProducts.length}`);
    
    if (shopProducts.length > 0) {
      console.log('Shop products:');
      shopProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} (ID: ${product._id})`);
        console.log(`   Unit: ${product.unit}, UnitCount: ${product.unitCount}`);
      });
    } else {
      console.log('No products found for this shop ID');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the function
testAPI(); 