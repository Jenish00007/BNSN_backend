const mongoose = require('mongoose');
const Category = require('./model/Category');

// Update category name from "Seads" to "Seeds" - Force update
async function updateCategoryName() {
  try {
    // Connect to MongoDB using the actual connection string
    await mongoose.connect('mongodb+srv://bnsninfo7_db_user:9IIszB9YaGepoLJ7@cluster0.fjkp50p.mongodb.net/?appName=Cluster0', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // First, let's find the exact category to confirm
    const category = await Category.findOne({ _id: '69666e0dab1d6391c2e19f3f' });
    console.log('Found category:', category ? category.name : 'Not found');
    
    if (category && category.name === 'Seads') {
      // Update the category
      const result = await Category.updateOne(
        { _id: '69666e0dab1d6391c2e19f3f' },
        { $set: { name: 'Seeds' } }
      );

      if (result.modifiedCount > 0) {
        console.log('✅ Successfully updated category from "Seads" to "Seeds"');
        console.log(`Modified ${result.modifiedCount} document(s)`);
      } else {
        console.log('❌ No changes made');
      }
    } else {
      console.log('❌ Category not found or already updated');
    }

    // Close connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    
  } catch (error) {
    console.error('❌ Error updating category:', error);
    process.exit(1);
  }
}

updateCategoryName();
