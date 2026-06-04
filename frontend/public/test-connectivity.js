// Quick connectivity test for frontend-backend communication
console.log('🔗 Testing Frontend-Backend Connectivity...\n');

// Test if we can reach the backend health endpoint through the frontend proxy
fetch('/api/health')
  .then(response => {
    if (response.ok) {
      return response.json();
    }
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  })
  .then(data => {
    console.log('✅ Backend connectivity successful!');
    console.log('📋 Response:', data);
    
    // Test authentication endpoint
    return fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@test.com',
        password: 'wrongpassword'
      })
    });
  })
  .then(response => {
    if (response.status === 400 || response.status === 401) {
      console.log('✅ Auth endpoint responding correctly (expected failure)');
      console.log('🎉 Frontend-Backend proxy is working!');
    } else {
      throw new Error(`Unexpected response: ${response.status}`);
    }
  })
  .catch(error => {
    console.error('❌ Connectivity test failed:', error.message);
    console.log('🔧 Troubleshooting:');
    console.log('- Make sure backend is running on port 5000');
    console.log('- Check if frontend proxy is configured correctly');
    console.log('- Try refreshing the page');
  });
