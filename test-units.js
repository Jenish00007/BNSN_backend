const fetch = require('node-fetch');

async function testUnitsAPI() {
  try {
    console.log('Testing Units API...');
    
    // Test the units endpoint
    const response = await fetch('http://localhost:8000/v2/product/units', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Units API working!');
      console.log('Units found:', data.data?.length || 0);
      if (data.data && data.data.length > 0) {
        console.log('Sample units:');
        data.data.slice(0, 3).forEach((unit, index) => {
          console.log(`${index + 1}. ${unit.name} (${unit.id})`);
        });
      }
    } else {
      console.log('❌ Units API failed');
      const errorText = await response.text();
      console.log('Error response:', errorText);
    }
  } catch (error) {
    console.error('❌ Error testing Units API:', error.message);
  }
}

testUnitsAPI(); 