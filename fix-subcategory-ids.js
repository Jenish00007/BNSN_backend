const mongoose = require('mongoose');
const Subcategory = require('./model/Subcategory');

// Use your existing MongoDB connection string
const mongoURI = 'mongodb+srv://bnsninfo7_db_user:9IIszB9YaGepoLJ7@cluster0.fjkp50p.mongodb.net/?appName=Cluster0';

async function fixSubcategoryIds() {
    try {
        console.log('Starting subcategory ID fix...');
        
        // Connect to MongoDB
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000, // 5 second timeout
            socketTimeoutMS: 45000, // 45 second timeout
        });
        
        console.log('Connected to MongoDB');
        
        // Get all subcategories sorted by creation date
        const subcategories = await Subcategory.find().sort({ createdAt: 1 }).limit(100); // Limit to prevent timeout
        
        console.log(`Found ${subcategories.length} subcategories to update`);
        
        let subcategoryId = 1;
        
        for (const subcategory of subcategories) {
            try {
                subcategory.subcategory_id = subcategoryId;
                await subcategory.save();
                console.log(`Updated ${subcategory.name} with subcategory_id: ${subcategory.subcategory_id}`);
                subcategoryId++;
            } catch (error) {
                console.error(`Error updating ${subcategory.name}:`, error.message);
            }
        }
        
        console.log('Subcategory IDs fixed successfully!');
    } catch (error) {
        console.error('Error fixing subcategory IDs:', error.message);
    } finally {
        // Close connection
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
        process.exit(0);
    }
}

fixSubcategoryIds();
