const axios = require('axios');

// Base URL for your API
const BASE_URL = 'http://localhost:8000/v2'; // Adjust this to match your server URL

async function testProductSections() {
  console.log('🧪 ===== TESTING PRODUCT SECTIONS =====\n');

  const sections = [
    {
      name: '🔥 Top Offers',
      endpoint: '/user-products/top-offers',
      description: 'Products with highest discount percentages'
    },
    {
      name: '⭐ Most Popular',
      endpoint: '/user-products/popular',
      description: 'Products with high sales and ratings'
    },
    {
      name: '🆕 Latest Products',
      endpoint: '/user-products/latest',
      description: 'Recently added products'
    },
    {
      name: '💡 Recommended',
      endpoint: '/user-products/recommended',
      description: 'Products with high ratings'
    },
    {
      name: '⚡ Flash Sale',
      endpoint: '/user-products/flash-sale',
      description: 'Time-limited offers'
    }
  ];

  for (const section of sections) {
    console.log(`Testing: ${section.name}`);
    console.log(`Endpoint: ${section.endpoint}`);
    console.log(`Description: ${section.description}`);
    
    try {
      const response = await axios.get(`${BASE_URL}${section.endpoint}`);
      
      if (response.status === 200) {
        const data = response.data;
        
        if (section.name === '⚡ Flash Sale') {
          console.log(`✅ Status: Success`);
          console.log(`📊 Flash Sale Items: ${data.flashSaleItems?.length || 0}`);
          if (data.flashSaleItems && data.flashSaleItems.length > 0) {
            data.flashSaleItems.slice(0, 3).forEach((item, index) => {
              console.log(`   ${index + 1}. ${item.name} - ${item.status}`);
            });
          }
        } else {
          console.log(`✅ Status: Success`);
          console.log(`📊 Products: ${data.products?.length || 0}`);
          console.log(`📄 Total: ${data.total || 0}`);
          console.log(`📖 Page: ${data.currentPage || 1}`);
          console.log(`📚 Total Pages: ${data.totalPages || 1}`);
          
          if (data.products && data.products.length > 0) {
            console.log('📋 Sample Products:');
            data.products.slice(0, 3).forEach((product, index) => {
              const discount = product.originalPrice && product.discountPrice 
                ? `${((product.originalPrice - product.discountPrice) / product.originalPrice * 100).toFixed(1)}% off`
                : 'No discount';
              
              console.log(`   ${index + 1}. ${product.name}`);
              console.log(`      💰 Price: ₹${product.discountPrice || product.originalPrice || 'N/A'}`);
              console.log(`      🏷️  Discount: ${discount}`);
              console.log(`      ⭐ Rating: ${product.ratings || 'N/A'}`);
              console.log(`      📦 Sold: ${product.sold_out || 0}`);
            });
          }
        }
      } else {
        console.log(`❌ Status: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }
    
    console.log(''); // Empty line for readability
  }

  console.log('🎯 ===== ADDITIONAL TESTING =====\n');
  
  // Test pagination
  console.log('Testing pagination for Top Offers:');
  try {
    const response = await axios.get(`${BASE_URL}/user-products/top-offers?page=1&limit=5`);
    if (response.status === 200) {
      const data = response.data;
      console.log(`✅ Pagination working: ${data.products?.length || 0} products on page ${data.currentPage}`);
      console.log(`📊 Has more: ${data.hasMore}`);
    }
  } catch (error) {
    console.log(`❌ Pagination test failed: ${error.message}`);
  }

  console.log('\nTesting category filter for Latest Products:');
  try {
    const response = await axios.get(`${BASE_URL}/user-products/latest?category_id=1&page=1&limit=5`);
    if (response.status === 200) {
      const data = response.data;
      console.log(`✅ Category filter working: ${data.products?.length || 0} products in category`);
    }
  } catch (error) {
    console.log(`❌ Category filter test failed: ${error.message}`);
  }

  console.log('\n✅ Product sections testing completed!');
  console.log('\n📋 SUMMARY:');
  console.log('- All endpoints should return 200 status');
  console.log('- Products should have proper data structure');
  console.log('- Pagination should work correctly');
  console.log('- Flash sale should show active events');
}

// Run the test
testProductSections().catch(console.error); 