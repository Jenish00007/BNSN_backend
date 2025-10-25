# Data Migration Script

This script migrates data from your existing database to the new MongoDB database (smartkal).

## What it migrates

- **Modules** - All modules with their images, descriptions, and status
- **Categories** - All categories linked to their respective modules
- **Subcategories** - All subcategories linked to their respective categories
- **Products** - All products with their complete data including reviews, ratings, and shop information

## Prerequisites

1. Make sure you have Node.js installed
2. Ensure your source database is accessible
3. The destination database is already configured: `mongodb+srv://smartkalfounder:Smartkal%402005@cluster0.mphmyn7.mongodb.net/smartkal`

## Setup

1. **Create/Update .env file** in the backend directory:
   ```env
   MONGODB_URI=mongodb://your-source-database-uri
   ```

2. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

## Running the Migration

### Method 1: Using npm script (Recommended)
```bash
npm run migrate
```

### Method 2: Direct execution
```bash
node scripts/runMigration.js
```

### Method 3: Using the migration module directly
```bash
node scripts/migrateData.js
```

## What the script does

1. **Connects to both databases** - Source and destination
2. **Migrates in order** to maintain relationships:
   - Modules first
   - Categories (linked to modules)
   - Subcategories (linked to categories)
   - Products (linked to categories and subcategories)
3. **Maintains relationships** by mapping old IDs to new IDs
4. **Provides detailed statistics** of the migration process
5. **Handles errors gracefully** and continues with other records

## Migration Process

The script will:

1. Show you the source and destination database URIs
2. Ask for confirmation before proceeding
3. Display progress for each entity type
4. Show detailed statistics at the end
5. Handle any errors and report them

## Output Example

```
🔄 Data Migration Tool
=====================

✅ Environment variables loaded
Source DB: mongodb://your-source-db
Destination DB: mongodb+srv://smartkalfounder:Smartkal%402005@cluster0.mphmyn7.mongodb.net/smartkal

⚠️  This will migrate all data to the new database. Continue? (y/N): y

🚀 Starting migration...

🔌 Connecting to source database...
🔌 Connecting to destination database...
✅ Both databases connected successfully!

📦 Starting module migration...
Found 5 modules to migrate
✅ Migrated module: Electronics
✅ Migrated module: Fashion
...

📂 Starting category migration...
Found 15 categories to migrate
✅ Migrated category: Smartphones
✅ Migrated category: Laptops
...

📁 Starting subcategory migration...
Found 45 subcategories to migrate
✅ Migrated subcategory: Android Phones
✅ Migrated subcategory: iPhones
...

🛍️  Starting product migration...
Found 150 products to migrate
✅ Migrated product: iPhone 13
✅ Migrated product: Samsung Galaxy S21
...

📊 Migration Statistics:
========================
Modules:
  Total: 5
  Migrated: 5
  Errors: 0

Categories:
  Total: 15
  Migrated: 15
  Errors: 0

Subcategories:
  Total: 45
  Migrated: 45
  Errors: 0

Products:
  Total: 150
  Migrated: 150
  Errors: 0

🎉 Migration completed successfully!
🔌 Source database connection closed
🔌 Destination database connection closed
```

## Error Handling

- If a module is missing for a category, the category will be skipped
- If a category is missing for a subcategory, the subcategory will be skipped
- If a category or subcategory is missing for a product, the product will be skipped
- All errors are logged and counted in the statistics

## Troubleshooting

### Connection Issues
- Check your source database URI in the .env file
- Ensure your network can access both databases
- Verify database credentials

### Missing Data
- Check the console output for warnings about missing relationships
- Ensure all parent entities exist before migrating child entities

### Permission Issues
- Ensure your database user has read permissions on source database
- Ensure your database user has write permissions on destination database

## Safety Features

- **Confirmation prompt** before starting migration
- **No data deletion** - only adds new data
- **Relationship validation** - ensures data integrity
- **Detailed logging** - tracks all operations
- **Error isolation** - one error doesn't stop the entire process

## After Migration

1. **Verify the data** in your new database
2. **Update your application** to use the new database URI
3. **Test your application** to ensure everything works correctly
4. **Backup your old database** before making any changes

## Support

If you encounter any issues:

1. Check the console output for error messages
2. Verify your database connections
3. Ensure all required environment variables are set
4. Check that your database schemas match the expected format 