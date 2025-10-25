const mongoose = require('mongoose');
const Product = require('../model/product');
const Event = require('../model/event');

const DB_URI = process.env.MONGODB_URI || "mongodb+srv://qaudsinfo:Qauds123@cluster0.nyfuhwt.mongodb.net/qauds?retryWrites=true&w=majority&appName=Cluster0";

async function manageProductSections() {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect(DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Database connected successfully!');

    console.log('\n📊 ===== PRODUCT SECTIONS MANAGEMENT =====\n');

    // 1. TOP OFFERS SECTION
    console.log('🔥 TOP OFFERS SECTION');
    console.log('Creating products with high discounts...');
    
    // Create sample products with discounts
    const topOffersData = [
      { name: "Premium Smartphone", originalPrice: 25000, discountPrice: 17500, category: "Electronics" },
      { name: "Designer Watch", originalPrice: 8000, discountPrice: 4800, category: "Fashion" },
      { name: "Wireless Headphones", originalPrice: 3000, discountPrice: 1800, category: "Electronics" },
      { name: "Running Shoes", originalPrice: 4500, discountPrice: 2700, category: "Sports" },
      { name: "Coffee Maker", originalPrice: 12000, discountPrice: 7200, category: "Home" }
    ];

    for (const data of topOffersData) {
      await Product.findOneAndUpdate(
        { name: data.name },
        {
          $set: {
            name: data.name,
            originalPrice: data.originalPrice,
            discountPrice: data.discountPrice,
            unitCount: 1,
            sold_out: Math.floor(Math.random() * 50) + 10,
            ratings: Math.floor(Math.random() * 2) + 4,
            category: data.category,
            description: `${data.name} - Limited time offer!`,
            images: [`https://via.placeholder.com/300x300/FF6B6B/FFFFFF?text=${encodeURIComponent(data.name)}`]
          }
        },
        { upsert: true, new: true }
      );
    }
    console.log('✅ Top Offers products created/updated');

    // 2. MOST POPULAR SECTION
    console.log('\n⭐ MOST POPULAR SECTION');
    console.log('Creating products with high sales and ratings...');
    
    const popularData = [
      { name: "Best Seller T-Shirt", sold_out: 150, ratings: 4.8, category: "Fashion" },
      { name: "Popular Gaming Mouse", sold_out: 200, ratings: 4.9, category: "Electronics" },
      { name: "Trending Water Bottle", sold_out: 300, ratings: 4.7, category: "Sports" },
      { name: "Viral Phone Case", sold_out: 180, ratings: 4.6, category: "Electronics" },
      { name: "Hot Selling Book", sold_out: 120, ratings: 4.8, category: "Books" }
    ];

    for (const data of popularData) {
      await Product.findOneAndUpdate(
        { name: data.name },
        {
          $set: {
            name: data.name,
            originalPrice: Math.floor(Math.random() * 2000) + 500,
            discountPrice: Math.floor(Math.random() * 1500) + 300,
            unitCount: 1,
            sold_out: data.sold_out,
            ratings: data.ratings,
            category: data.category,
            description: `${data.name} - Customer favorite!`,
            images: [`https://via.placeholder.com/300x300/4ECDC4/FFFFFF?text=${encodeURIComponent(data.name)}`]
          }
        },
        { upsert: true, new: true }
      );
    }
    console.log('✅ Most Popular products created/updated');

    // 3. LATEST PRODUCTS SECTION
    console.log('\n🆕 LATEST PRODUCTS SECTION');
    console.log('Creating recently added products...');
    
    const latestData = [
      { name: "New Arrival Laptop", category: "Electronics" },
      { name: "Fresh Organic Fruits", category: "Grocery" },
      { name: "Latest Fashion Dress", category: "Fashion" },
      { name: "New Kitchen Gadget", category: "Home" },
      { name: "Recent Release Game", category: "Entertainment" }
    ];

    for (const data of latestData) {
      await Product.findOneAndUpdate(
        { name: data.name },
        {
          $set: {
            name: data.name,
            originalPrice: Math.floor(Math.random() * 3000) + 800,
            discountPrice: Math.floor(Math.random() * 2000) + 500,
            unitCount: 1,
            sold_out: Math.floor(Math.random() * 30) + 5,
            ratings: Math.floor(Math.random() * 2) + 3,
            category: data.category,
            description: `${data.name} - Just arrived!`,
            images: [`https://via.placeholder.com/300x300/45B7D1/FFFFFF?text=${encodeURIComponent(data.name)}`],
            createdAt: new Date()
          }
        },
        { upsert: true, new: true }
      );
    }
    console.log('✅ Latest products created/updated');

    // 4. RECOMMENDED PRODUCTS SECTION
    console.log('\n💡 RECOMMENDED PRODUCTS SECTION');
    console.log('Creating products with high ratings and moderate sales...');
    
    const recommendedData = [
      { name: "Recommended Yoga Mat", ratings: 4.9, sold_out: 80, category: "Sports" },
      { name: "Editor's Choice Camera", ratings: 4.8, sold_out: 65, category: "Electronics" },
      { name: "Staff Pick Novel", ratings: 4.7, sold_out: 95, category: "Books" },
      { name: "Customer Choice Bag", ratings: 4.9, sold_out: 110, category: "Fashion" },
      { name: "Top Rated Speaker", ratings: 4.8, sold_out: 75, category: "Electronics" }
    ];

    for (const data of recommendedData) {
      await Product.findOneAndUpdate(
        { name: data.name },
        {
          $set: {
            name: data.name,
            originalPrice: Math.floor(Math.random() * 2500) + 600,
            discountPrice: Math.floor(Math.random() * 1800) + 400,
            unitCount: 1,
            sold_out: data.sold_out,
            ratings: data.ratings,
            category: data.category,
            description: `${data.name} - Highly recommended!`,
            images: [`https://via.placeholder.com/300x300/96CEB4/FFFFFF?text=${encodeURIComponent(data.name)}`]
          }
        },
        { upsert: true, new: true }
      );
    }
    console.log('✅ Recommended products created/updated');

    // 5. FLASH SALE SECTION
    console.log('\n⚡ FLASH SALE SECTION');
    console.log('Creating flash sale events...');
    
    const flashSaleData = [
      {
        name: "Flash Sale - Electronics",
        start_Date: new Date(),
        Finish_Date: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        status: "Running",
        description: "24-hour flash sale on electronics!"
      },
      {
        name: "Flash Sale - Fashion",
        start_Date: new Date(),
        Finish_Date: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
        status: "Running",
        description: "12-hour flash sale on fashion items!"
      }
    ];

    for (const data of flashSaleData) {
      await Event.findOneAndUpdate(
        { name: data.name },
        {
          $set: {
            name: data.name,
            start_Date: data.start_Date,
            Finish_Date: data.Finish_Date,
            status: data.status,
            description: data.description
          }
        },
        { upsert: true, new: true }
      );
    }
    console.log('✅ Flash sale events created/updated');

    // 6. DISPLAY SUMMARY
    console.log('\n📈 ===== SECTION SUMMARY =====\n');

    // Count products in each section
    const topOffersCount = await Product.countDocuments({
      originalPrice: { $exists: true, $gt: 0 },
      discountPrice: { $exists: true, $gt: 0 }
    });

    const popularCount = await Product.countDocuments({
      sold_out: { $gte: 50 }
    });

    const latestCount = await Product.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    });

    const recommendedCount = await Product.countDocuments({
      ratings: { $gte: 4.5 }
    });

    const flashSaleCount = await Event.countDocuments({
      status: "Running",
      start_Date: { $lte: new Date() },
      Finish_Date: { $gte: new Date() }
    });

    console.log(`🔥 Top Offers: ${topOffersCount} products`);
    console.log(`⭐ Most Popular: ${popularCount} products`);
    console.log(`🆕 Latest Products: ${latestCount} products`);
    console.log(`💡 Recommended: ${recommendedCount} products`);
    console.log(`⚡ Flash Sale: ${flashSaleCount} active events`);

    // 7. API TESTING INFO
    console.log('\n🧪 ===== API TESTING ENDPOINTS =====\n');
    console.log('Test these endpoints to verify your product sections:');
    console.log('');
    console.log('🔥 Top Offers:');
    console.log('GET /user-products/top-offers');
    console.log('GET /user-products/top-offers?page=1&limit=10');
    console.log('');
    console.log('⭐ Most Popular:');
    console.log('GET /user-products/popular');
    console.log('GET /user-products/popular?page=1&limit=10');
    console.log('');
    console.log('🆕 Latest Products:');
    console.log('GET /user-products/latest');
    console.log('GET /user-products/latest?page=1&limit=10');
    console.log('');
    console.log('💡 Recommended:');
    console.log('GET /user-products/recommended');
    console.log('GET /user-products/recommended?page=1&limit=10');
    console.log('');
    console.log('⚡ Flash Sale:');
    console.log('GET /user-products/flash-sale');
    console.log('');

    console.log('✅ Product sections management completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the function
manageProductSections(); 