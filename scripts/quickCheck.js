const mongoose = require('mongoose');
const Product = require('../model/product');

const DB_URI = process.env.MONGODB_URI || "mongodb+srv://qaudsinfo:Qauds123@cluster0.nyfuhwt.mongodb.net/qauds?retryWrites=true&w=majority&appName=Cluster0";

async function quickCheck() {
  try {
    await mongoose.connect(DB_URI);
    console.log('Connected to database');
    
    const total = await Product.countDocuments();
    console.log(`Total products: ${total}`);
    
    const sample = await Product.findOne();
    if (sample) {
      console.log('Sample product fields:', Object.keys(sample.toObject()));
      console.log('unitCount:', sample.unitCount);
      console.log('unit:', sample.unit);
    }
    
    const withoutUnitCount = await Product.countDocuments({
      $or: [
        { unitCount: { $exists: false } },
        { unitCount: null },
        { unitCount: undefined }
      ]
    });
    
    console.log(`Products without unitCount: ${withoutUnitCount}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

quickCheck(); 