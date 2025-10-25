#!/usr/bin/env node

const { runMigration } = require('./migrateData');

console.log('🔄 Data Migration Tool');
console.log('=====================\n');

// Check if .env file exists and has MONGODB_URI
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found in backend directory');
  console.log('Please create a .env file with your source database URI:');
  console.log('MONGODB_URI=mongodb://your-source-database-uri');
  process.exit(1);
}

// Load environment variables
require('dotenv').config({ path: envPath });

if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env file');
  console.log('Please add your source database URI to .env file:');
  console.log('MONGODB_URI=mongodb://your-source-database-uri');
  process.exit(1);
}

console.log('✅ Environment variables loaded');
console.log('Source DB:', process.env.MONGODB_URI);
console.log('Destination DB: mongodb+srv://smartkalfounder:Smartkal%402005@cluster0.mphmyn7.mongodb.net/smartkal\n');

// Confirm before running
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('⚠️  This will migrate all data to the new database. Continue? (y/N): ', (answer) => {
  rl.close();
  
  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    console.log('\n🚀 Starting migration...\n');
    runMigration()
      .then(() => {
        console.log('\n✅ Migration script completed');
        process.exit(0);
      })
      .catch((error) => {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
      });
  } else {
    console.log('❌ Migration cancelled');
    process.exit(0);
  }
}); 