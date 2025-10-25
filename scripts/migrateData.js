const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Module = require('../model/Module');
const Category = require('../model/Category');
const Subcategory = require('../model/Subcategory');
const Product = require('../model/product');

// Database configurations
const SOURCE_DB_URI = 'mongodb+srv://qaudsinfo:Qauds123@cluster0.nyfuhwt.mongodb.net/qauds?retryWrites=true&w=majority&appName=Cluster0';
const DEST_DB_URI = 'mongodb+srv://smartkalfounder:Smartkal%402005@cluster0.mphmyn7.mongodb.net/smartkal?retryWrites=true&w=majority&appName=Cluster0';

// Create separate connections for source and destination
let sourceConnection, destConnection;

// Migration statistics
const migrationStats = {
  modules: { total: 0, migrated: 0, errors: 0 },
  categories: { total: 0, migrated: 0, errors: 0 },
  subcategories: { total: 0, migrated: 0, errors: 0 },
  products: { total: 0, migrated: 0, errors: 0 }
};

// ID mapping to maintain relationships
const idMapping = {
  modules: new Map(),
  categories: new Map(),
  subcategories: new Map()
};

// Define schemas and register models for both connections
function registerModels(connection) {
  // Module Schema
  const moduleSchema = new mongoose.Schema({
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true
    },
    name: {
      type: String,
      required: [true, 'Module name is required'],
      unique: true,
      trim: true
    },
    image: {
      type: String,
      required: [true, 'Module image is required']
    },
    description: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }, {
    timestamps: true
  });

  // Category Schema
  const categorySchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      trim: true
    },
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: true
    },
    image: {
      type: String,
      required: true
    },
    description: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  });

  // Subcategory Schema
  const subcategorySchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    image: {
      type: String,
      required: true
    },
    description: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  });

  // Product Schema
  const productSchema = new mongoose.Schema({
    name: {
      type: String,
      required: [true, "Please enter your product name!"],
    },
    description: {
      type: String,
      required: [true, "Please enter your product description!"],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, "Please select a category!"],
    },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subcategory',
      required: [true, "Please select a subcategory!"],
    },
    tags: {
      type: String,
    },
    originalPrice: {
      type: Number,
    },
    discountPrice: {
      type: Number,
      required: [true, "Please enter your product price!"],
    },
    stock: {
      type: Number,
      required: [true, "Please enter your product stock!"],
    },
    unit: {
      type: String,
      enum: ['kg', 'pcs', 'lr', 'Pack'],
      required: [true, "Please select a unit!"],
    },
    unitCount: {
      type: Number,
      required: [true, "Please enter unit count!"],
    },
    maxPurchaseQuantity: {
      type: Number,
      required: [true, "Please enter maximum purchase quantity!"],
    },
    images: [
      {
        type: String,
      },
    ],
    reviews: [
      {
        user: {
          type: Object,
        },
        rating: {
          type: Number,
        },
        comment: {
          type: String,
        },
        productId: {
          type: String,
        },
        createdAt: {
          type: Date,
          default: Date.now(),
        },
      },
    ],
    ratings: {
      type: Number,
    },
    shopId: {
      type: String,
      required: true,
    },
    shop: {
      type: Object,
      required: true,
    },
    sold_out: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
  });

  // Register models on the connection
  connection.model('Module', moduleSchema);
  connection.model('Category', categorySchema);
  connection.model('Subcategory', subcategorySchema);
  connection.model('Product', productSchema);
}

async function connectToDatabases() {
  try {
    console.log('🔌 Connecting to source database...');
    sourceConnection = mongoose.createConnection(SOURCE_DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('🔌 Connecting to destination database...');
    destConnection = mongoose.createConnection(DEST_DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Wait for connections
    await sourceConnection.asPromise();
    await destConnection.asPromise();

    // Register models for both connections
    registerModels(sourceConnection);
    registerModels(destConnection);

    console.log('✅ Both databases connected successfully!');
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    return false;
  }
}

async function migrateModules() {
  try {
    console.log('\n📦 Starting module migration...');
    
    // Get source modules
    const sourceModules = await sourceConnection.model('Module').find({});
    migrationStats.modules.total = sourceModules.length;
    
    console.log(`Found ${sourceModules.length} modules to migrate`);

    for (const module of sourceModules) {
      try {
        // Create new module in destination
        const newModule = new (destConnection.model('Module'))({
          name: module.name,
          image: module.image,
          description: module.description,
          isActive: module.isActive,
          createdAt: module.createdAt,
          updatedAt: module.updatedAt
        });

        const savedModule = await newModule.save();
        
        // Store ID mapping
        idMapping.modules.set(module._id.toString(), savedModule._id.toString());
        
        migrationStats.modules.migrated++;
        console.log(`✅ Migrated module: ${module.name}`);
      } catch (error) {
        migrationStats.modules.errors++;
        console.error(`❌ Error migrating module ${module.name}:`, error.message);
      }
    }
  } catch (error) {
    console.error('❌ Error in module migration:', error.message);
  }
}

async function migrateCategories() {
  try {
    console.log('\n📂 Starting category migration...');
    
    // Get source categories
    const sourceCategories = await sourceConnection.model('Category').find({}).populate('module');
    migrationStats.categories.total = sourceCategories.length;
    
    console.log(`Found ${sourceCategories.length} categories to migrate`);

    for (const category of sourceCategories) {
      try {
        // Get new module ID from mapping
        const newModuleId = idMapping.modules.get(category.module._id.toString());
        
        if (!newModuleId) {
          console.warn(`⚠️  Module not found for category ${category.name}, skipping...`);
          migrationStats.categories.errors++;
          continue;
        }

        // Create new category in destination
        const newCategory = new (destConnection.model('Category'))({
          name: category.name,
          module: newModuleId,
          image: category.image,
          description: category.description,
          isActive: category.isActive,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt
        });

        const savedCategory = await newCategory.save();
        
        // Store ID mapping
        idMapping.categories.set(category._id.toString(), savedCategory._id.toString());
        
        migrationStats.categories.migrated++;
        console.log(`✅ Migrated category: ${category.name}`);
      } catch (error) {
        migrationStats.categories.errors++;
        console.error(`❌ Error migrating category ${category.name}:`, error.message);
      }
    }
  } catch (error) {
    console.error('❌ Error in category migration:', error.message);
  }
}

async function migrateSubcategories() {
  try {
    console.log('\n📁 Starting subcategory migration...');
    
    // Get source subcategories
    const sourceSubcategories = await sourceConnection.model('Subcategory').find({}).populate('category');
    migrationStats.subcategories.total = sourceSubcategories.length;
    
    console.log(`Found ${sourceSubcategories.length} subcategories to migrate`);

    for (const subcategory of sourceSubcategories) {
      try {
        // Get new category ID from mapping
        const newCategoryId = idMapping.categories.get(subcategory.category._id.toString());
        
        if (!newCategoryId) {
          console.warn(`⚠️  Category not found for subcategory ${subcategory.name}, skipping...`);
          migrationStats.subcategories.errors++;
          continue;
        }

        // Create new subcategory in destination
        const newSubcategory = new (destConnection.model('Subcategory'))({
          name: subcategory.name,
          category: newCategoryId,
          image: subcategory.image,
          description: subcategory.description,
          isActive: subcategory.isActive,
          createdAt: subcategory.createdAt,
          updatedAt: subcategory.updatedAt
        });

        const savedSubcategory = await newSubcategory.save();
        
        // Store ID mapping
        idMapping.subcategories.set(subcategory._id.toString(), savedSubcategory._id.toString());
        
        migrationStats.subcategories.migrated++;
        console.log(`✅ Migrated subcategory: ${subcategory.name}`);
      } catch (error) {
        migrationStats.subcategories.errors++;
        console.error(`❌ Error migrating subcategory ${subcategory.name}:`, error.message);
      }
    }
  } catch (error) {
    console.error('❌ Error in subcategory migration:', error.message);
  }
}

async function migrateProducts() {
  try {
    console.log('\n🛍️  Starting product migration...');
    
    // Get source products
    const sourceProducts = await sourceConnection.model('Product').find({})
      .populate('category')
      .populate('subcategory');
    migrationStats.products.total = sourceProducts.length;
    
    console.log(`Found ${sourceProducts.length} products to migrate`);

    for (const product of sourceProducts) {
      try {
        // Get new category and subcategory IDs from mapping
        const newCategoryId = idMapping.categories.get(product.category._id.toString());
        const newSubcategoryId = idMapping.subcategories.get(product.subcategory._id.toString());
        
        if (!newCategoryId || !newSubcategoryId) {
          console.warn(`⚠️  Category or subcategory not found for product ${product.name}, skipping...`);
          migrationStats.products.errors++;
          continue;
        }

        // Create new product in destination
        const newProduct = new (destConnection.model('Product'))({
          name: product.name,
          description: product.description,
          category: newCategoryId,
          subcategory: newSubcategoryId,
          tags: product.tags,
          originalPrice: product.originalPrice,
          discountPrice: product.discountPrice,
          stock: product.stock,
          unit: product.unit,
          unitCount: product.unitCount || 1, // Default to 1 if not present in source
          maxPurchaseQuantity: product.maxPurchaseQuantity,
          images: product.images,
          reviews: product.reviews,
          ratings: product.ratings,
          shopId: product.shopId,
          shop: product.shop,
          sold_out: product.sold_out,
          createdAt: product.createdAt
        });

        await newProduct.save();
        
        migrationStats.products.migrated++;
        console.log(`✅ Migrated product: ${product.name}`);
      } catch (error) {
        migrationStats.products.errors++;
        console.error(`❌ Error migrating product ${product.name}:`, error.message);
      }
    }
  } catch (error) {
    console.error('❌ Error in product migration:', error.message);
  }
}

function printMigrationStats() {
  console.log('\n📊 Migration Statistics:');
  console.log('========================');
  
  Object.entries(migrationStats).forEach(([entity, stats]) => {
    console.log(`${entity.charAt(0).toUpperCase() + entity.slice(1)}:`);
    console.log(`  Total: ${stats.total}`);
    console.log(`  Migrated: ${stats.migrated}`);
    console.log(`  Errors: ${stats.errors}`);
    console.log('');
  });
}

async function closeConnections() {
  try {
    if (sourceConnection) {
      await sourceConnection.close();
      console.log('🔌 Source database connection closed');
    }
    if (destConnection) {
      await destConnection.close();
      console.log('🔌 Destination database connection closed');
    }
  } catch (error) {
    console.error('❌ Error closing connections:', error.message);
  }
}

async function runMigration() {
  console.log('🚀 Starting data migration...');
  console.log('Source DB:', SOURCE_DB_URI);
  console.log('Destination DB:', DEST_DB_URI);
  
  const connected = await connectToDatabases();
  if (!connected) {
    console.error('❌ Failed to connect to databases. Exiting...');
    process.exit(1);
  }

  try {
    // Run migrations in order to maintain relationships
    await migrateModules();
    await migrateCategories();
    await migrateSubcategories();
    await migrateProducts();
    
    printMigrationStats();
    
    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await closeConnections();
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  runMigration().catch(console.error);
}

module.exports = {
  runMigration,
  connectToDatabases,
  migrateModules,
  migrateCategories,
  migrateSubcategories,
  migrateProducts,
  closeConnections
}; 