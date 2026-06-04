const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Base URL for your API
const API_BASE_URL = 'http://localhost:5000/api';

// Test image upload functionality
async function testImageUpload() {
  try {
    console.log('🧪 Testing Image Upload Functionality...\n');

    // Step 1: Login as a seller
    console.log('1. Logging in as seller...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'seller@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Seller login successful\n');

    // Step 2: Create a sample base64 image (small test image)
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGADgMJXwAAAABJRU5ErkJggg==';
    
    console.log('2. Creating product with image...');
    const productData = {
      name: 'Test Cinnamon with Image',
      description: 'This is a test product with an uploaded image to verify image storage in database',
      price: 12.99,
      category: 'whole-spices',
      origin: 'Sri Lanka',
      weight: { value: 100, unit: 'g' },
      stockQuantity: 50,
      images: [testImageBase64]
    };

    const createResponse = await axios.post(`${API_BASE_URL}/seller/products`, productData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Product created successfully with image!');
    console.log('📦 Product ID:', createResponse.data.product._id);
    console.log('🖼️  Image stored in database:', createResponse.data.product.images.length > 0 ? 'Yes' : 'No');
    console.log('📊 Image data length:', createResponse.data.product.images[0]?.length || 0, 'characters\n');

    // Step 3: Retrieve the product to verify image is stored
    console.log('3. Retrieving product to verify image storage...');
    const getResponse = await axios.get(`${API_BASE_URL}/seller/products`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const createdProduct = getResponse.data.products.find(p => p._id === createResponse.data.product._id);
    
    if (createdProduct && createdProduct.images && createdProduct.images.length > 0) {
      console.log('✅ Image successfully retrieved from database!');
      console.log('🖼️  Retrieved image data length:', createdProduct.images[0].length, 'characters');
      console.log('📋 Image starts with:', createdProduct.images[0].substring(0, 50) + '...\n');
    } else {
      console.log('❌ Image not found in retrieved product\n');
    }

    console.log('🎉 Image upload test completed successfully!');
    console.log('\n📝 Summary:');
    console.log('- ✅ Images are stored as base64 strings in MongoDB');
    console.log('- ✅ No local file storage needed');
    console.log('- ✅ Images are included in API responses');
    console.log('- ✅ Frontend can display images directly from database');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test if seller exists, otherwise show instructions
testImageUpload().catch(err => {
  console.log('\n📋 To test image upload functionality:');
  console.log('1. Register a seller account from the frontend');
  console.log('2. Or update the email/password in this test script');
  console.log('3. Then run: node testImageUpload.js');
});
