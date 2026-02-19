const axios = require('axios');

async function testPasswordUpdate() {
  try {
    // First, login to get token
    const loginResponse = await axios.post('http://localhost:8000/v2/user/login-user', {
      email: 'hemantr128@gmail.com',
      password: 'Hem@2000' // Current password (from production logs)
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    console.log('Token:', token.substring(0, 50) + '...');

    // Now test password update
    const updateResponse = await axios.put(
      'http://localhost:8000/v2/user/update-user-info',
      {
        name: 'Hemant Rajput',
        email: 'hemantr128@gmail.com',
        phoneNumber: '9340208047',
        hidePhoneNumber: true,
        password: 'NewPassword123!' // New password
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Password update successful');
    console.log('Response:', updateResponse.data);

    // Test login with new password
    const newLoginResponse = await axios.post('http://localhost:8000/v2/user/login-user', {
      email: 'hemantr128@gmail.com',
      password: 'NewPassword123!' // New password
    });

    console.log('✅ Login with new password successful');
    console.log('New token:', newLoginResponse.data.token.substring(0, 50) + '...');

    // Test login with old password (should fail)
    try {
      await axios.post('http://localhost:8000/v2/user/login-user', {
        email: 'hemantr128@gmail.com',
        password: 'Hem@2002' // Old password
      });
      console.log('❌ ERROR: Login with old password should have failed!');
    } catch (error) {
      console.log('✅ Login with old password correctly failed');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testPasswordUpdate();
