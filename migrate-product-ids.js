const mongoose = require("mongoose");
const Product = require("./model/product");
require("dotenv").config();

const migrateProductIds = async () => {
  try {
    // Connect to the correct MongoDB (the one the server is using)
    const MONGODB_URI = "mongodb+srv://bnsninfo7_db_user:9IIszB9YaGepoLJ7@cluster0.fjkp50p.mongodb.net/?appName=Cluster0";
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    // Find all products without productId
    const productsWithoutProductId = await Product.find({ productId: { $exists: false } });
    console.log(`Found ${productsWithoutProductId.length} products without productId`);

    // Get the highest existing productId
    const lastProduct = await Product.findOne({}, {}, { sort: { productId: -1 } });
    let nextProductId = lastProduct && lastProduct.productId ? lastProduct.productId + 1 : 1;

    console.log(`Starting productId assignment from: ${nextProductId}`);

    // Update products
    for (const product of productsWithoutProductId) {
      try {
        product.productId = nextProductId++;
        await product.save();
        console.log(`Updated product ${product.name} with productId: ${product.productId}`);
      } catch (error) {
        console.error(`Error updating product ${product._id}:`, error);
      }
    }

    // Verify the migration
    const totalProducts = await Product.countDocuments();
    const productsWithProductId = await Product.countDocuments({ productId: { $exists: true } });
    const productsWithoutProductIdAfter = await Product.countDocuments({ productId: { $exists: false } });
    
    console.log(`\nMigration completed!`);
    console.log(`Total products: ${totalProducts}`);
    console.log(`Products with productId: ${productsWithProductId}`);
    console.log(`Products without productId: ${productsWithoutProductIdAfter}`);
    
    // Show updated products
    console.log("\nUpdated products:");
    const updatedProducts = await Product.find().sort({ productId: 1 }).limit(10);
    updatedProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - productId: ${product.productId}`);
    });
    
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    mongoose.connection.close();
    process.exit(1);
  }
};

migrateProductIds();
