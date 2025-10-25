const axios = require('axios');

// Test the product API endpoints
async function testProductAPI() {
  const baseURL = 'http://localhost:8000'; // Adjust this to your server URL
  
  try {
    console.log('🧪 Testing Product API Endpoints...\n');

    // Test 1: Get all products
    console.log('1️⃣ Testing GET /product/get-all-products');
    try {
      const response = await axios.get(`${baseURL}/product/get-all-products?page=1&limit=5`);
      console.log('✅ Response status:', response.status);
      console.log('📊 Products returned:', response.data.products?.length || 0);
      
      if (response.data.products && response.data.products.length > 0) {
        const firstProduct = response.data.products[0];
        console.log('🔍 First product fields:', Object.keys(firstProduct));
        console.log('📦 First product unitCount:', firstProduct.unitCount);
        console.log('📦 First product unit:', firstProduct.unit);
        console.log('📦 First product name:', firstProduct.name);
      }
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Get admin all products
    console.log('2️⃣ Testing GET /product/admin-all-products');
    try {
      const response = await axios.get(`${baseURL}/product/admin-all-products`);
      console.log('✅ Response status:', response.status);
      console.log('📊 Products returned:', response.data.products?.length || 0);
      
      if (response.data.products && response.data.products.length > 0) {
        const firstProduct = response.data.products[0];
        console.log('🔍 First product fields:', Object.keys(firstProduct));
        console.log('📦 First product unitCount:', firstProduct.unitCount);
        console.log('📦 First product unit:', firstProduct.unit);
        console.log('📦 First product name:', firstProduct.name);
      }
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Get products by category
    console.log('3️⃣ Testing GET /product/categories/items/0');
    try {
      const response = await axios.get(`${baseURL}/product/categories/items/0?limit=5&offset=1&type=all`);
      console.log('✅ Response status:', response.status);
      console.log('📊 Products returned:', response.data.products?.length || 0);
      
      if (response.data.products && response.data.products.length > 0) {
        const firstProduct = response.data.products[0];
        console.log('🔍 First product fields:', Object.keys(firstProduct));
        console.log('📦 First product unitCount:', firstProduct.unitCount);
        console.log('📦 First product unit:', firstProduct.unit);
        console.log('📦 First product name:', firstProduct.name);
      }
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 4: Search products
    console.log('4️⃣ Testing GET /product/items/search');
    try {
      const response = await axios.get(`${baseURL}/product/items/search?name=&category_id=0&limit=5&offset=1`);
      console.log('✅ Response status:', response.status);
      console.log('📊 Products returned:', response.data.products?.length || 0);
      
      if (response.data.products && response.data.products.length > 0) {
        const firstProduct = response.data.products[0];
        console.log('🔍 First product fields:', Object.keys(firstProduct));
        console.log('📦 First product unitCount:', firstProduct.unitCount);
        console.log('📦 First product unit:', firstProduct.unit);
        console.log('📦 First product name:', firstProduct.name);
      }
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ General error:', error.message);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testProductAPI().catch(console.error);
}

module.exports = {
  testProductAPI
}; 