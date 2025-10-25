const mongoose = require('mongoose');
const Unit = require('../model/Unit');

// Database connection string
const DB_URI = process.env.MONGODB_URI || "mongodb+srv://qaudsinfo:Qauds123@cluster0.nyfuhwt.mongodb.net/qauds?retryWrites=true&w=majority&appName=Cluster0";

const defaultUnits = [
  // Weight units
  { id: 'kg', name: 'Kilograms (kg)', description: 'Weight in kilograms', category: 'weight', sortOrder: 1 },
  { id: 'g', name: 'Grams (g)', description: 'Weight in grams', category: 'weight', sortOrder: 2 },
  { id: 'lb', name: 'Pounds (lb)', description: 'Weight in pounds', category: 'weight', sortOrder: 3 },
  { id: 'oz', name: 'Ounces (oz)', description: 'Weight in ounces', category: 'weight', sortOrder: 4 },
  
  // Volume units
  { id: 'ltr', name: 'Liters (ltr)', description: 'Volume in liters', category: 'volume', sortOrder: 5 },
  { id: 'ml', name: 'Milliliters (ml)', description: 'Volume in milliliters', category: 'volume', sortOrder: 6 },
  { id: 'gal', name: 'Gallons (gal)', description: 'Volume in gallons', category: 'volume', sortOrder: 7 },
  
  // Count units
  { id: 'pcs', name: 'Pieces (pcs)', description: 'Individual items', category: 'count', sortOrder: 8 },
  { id: 'pack', name: 'Pack', description: 'Packaged items', category: 'count', sortOrder: 9 },
  { id: 'box', name: 'Box', description: 'Boxed items', category: 'count', sortOrder: 10 },
  { id: 'bottle', name: 'Bottle', description: 'Bottled items', category: 'count', sortOrder: 11 },
  { id: 'can', name: 'Can', description: 'Canned items', category: 'count', sortOrder: 12 },
  { id: 'bag', name: 'Bag', description: 'Bagged items', category: 'count', sortOrder: 13 },
  { id: 'dozen', name: 'Dozen', description: '12 items', category: 'count', sortOrder: 14 },
  { id: 'pair', name: 'Pair', description: '2 items', category: 'count', sortOrder: 15 },
  { id: 'set', name: 'Set', description: 'Set of items', category: 'count', sortOrder: 16 },
  { id: 'bundle', name: 'Bundle', description: 'Bundled items', category: 'count', sortOrder: 17 },
  
  // Length units
  { id: 'meter', name: 'Meter (m)', description: 'Length in meters', category: 'length', sortOrder: 18 },
  { id: 'cm', name: 'Centimeter (cm)', description: 'Length in centimeters', category: 'length', sortOrder: 19 },
  { id: 'inch', name: 'Inch', description: 'Length in inches', category: 'length', sortOrder: 20 },
  { id: 'foot', name: 'Foot (ft)', description: 'Length in feet', category: 'length', sortOrder: 21 },
  { id: 'yard', name: 'Yard (yd)', description: 'Length in yards', category: 'length', sortOrder: 22 },
  
  // Area units
  { id: 'sqm', name: 'Square Meter (sqm)', description: 'Area in square meters', category: 'area', sortOrder: 23 },
  { id: 'sqft', name: 'Square Foot (sqft)', description: 'Area in square feet', category: 'area', sortOrder: 24 },
  
  // Time units
  { id: 'hour', name: 'Hour (hr)', description: 'Time in hours', category: 'time', sortOrder: 25 },
  { id: 'minute', name: 'Minute (min)', description: 'Time in minutes', category: 'time', sortOrder: 26 },
  { id: 'day', name: 'Day', description: 'Time in days', category: 'time', sortOrder: 27 },
  { id: 'week', name: 'Week', description: 'Time in weeks', category: 'time', sortOrder: 28 },
  { id: 'month', name: 'Month', description: 'Time in months', category: 'time', sortOrder: 29 },
  { id: 'year', name: 'Year', description: 'Time in years', category: 'time', sortOrder: 30 }
];

async function seedUnits() {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect(DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Database connected successfully!');

    // Check if units already exist
    const existingUnits = await Unit.find({});
    console.log(`📊 Found ${existingUnits.length} existing units in database`);

    if (existingUnits.length > 0) {
      console.log('⚠️  Units already exist in database. Skipping seed.');
      console.log('📋 Existing units:');
      existingUnits.forEach((unit, index) => {
        console.log(`${index + 1}. ${unit.name} (${unit.id}) - ${unit.category}`);
      });
      return;
    }

    // Insert default units
    console.log('🌱 Seeding default units...');
    const insertedUnits = await Unit.insertMany(defaultUnits);
    console.log(`✅ Successfully inserted ${insertedUnits.length} units`);

    // Display inserted units by category
    console.log('\n📋 Inserted units by category:');
    const categories = ['weight', 'volume', 'count', 'length', 'area', 'time'];
    
    for (const category of categories) {
      const categoryUnits = insertedUnits.filter(unit => unit.category === category);
      if (categoryUnits.length > 0) {
        console.log(`\n${category.toUpperCase()}:`);
        categoryUnits.forEach((unit, index) => {
          console.log(`  ${index + 1}. ${unit.name} (${unit.id})`);
        });
      }
    }

    console.log('\n🎉 Unit seeding completed successfully!');
    console.log('\n📋 Available API endpoints:');
    console.log('- GET /v2/units - Get all units');
    console.log('- GET /v2/units/category/:category - Get units by category');
    console.log('- GET /v2/units/:id - Get unit by ID');
    console.log('- POST /v2/units - Create new unit (Admin only)');
    console.log('- PUT /v2/units/:id - Update unit (Admin only)');
    console.log('- DELETE /v2/units/:id - Delete unit (Admin only)');

  } catch (error) {
    console.error('❌ Error seeding units:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database disconnected');
  }
}

// Run the seed function
seedUnits(); 