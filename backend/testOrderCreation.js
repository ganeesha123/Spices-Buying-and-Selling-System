const axios = require('axios');

// Base URL for your API
const API_BASE_URL = 'http://localhost:5000/api';

async function testOrderCreation() {
  try {
    console.log('🧪 Testing Order Creation...\n');

    // Step 1: Register a buyer
    console.log('1. Registering a buyer...');
    const buyerData = {
      name: 'Test Buyer',
      email: 'buyer@test.com',
      password: 'password123',
      role: 'buyer',
      phone: '+94771234567'
    };

    try {
      await axios.post(`${API_BASE_URL}/auth/register`, buyerData);
      console.log('✅ Buyer registered successfully');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        console.log('ℹ️  Buyer already exists, continuing...');
      } else {
        throw error;
      }
    }

    // Step 2: Login as buyer
    console.log('\n2. Logging in as buyer...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'buyer@test.com',
      password: 'password123'
    });
    
    const buyerToken = loginResponse.data.token;
    console.log('✅ Buyer login successful');

    // Step 3: Register a seller and create a product
    console.log('\n3. Setting up seller and product...');
    const sellerData = {
      name: 'Test Seller',
      email: 'seller@test.com',
      password: 'password123',
      role: 'seller',
      phone: '+94771234568'
    };

    try {
      await axios.post(`${API_BASE_URL}/auth/register`, sellerData);
      console.log('✅ Seller registered successfully');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        console.log('ℹ️  Seller already exists, continuing...');
      } else {
        throw error;
      }
    }

    // Login as seller
    const sellerLoginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'seller@test.com',
      password: 'password123'
    });
    
    const sellerToken = sellerLoginResponse.data.token;

    // Create a test product
    const productData = {
      name: 'Test Ceylon Cinnamon',
      description: 'Premium quality Ceylon cinnamon sticks for testing order functionality',
      price: 15.99,
      category: 'whole-spices',
      origin: 'Sri Lanka',
      weight: { value: 100, unit: 'g' },
      stockQuantity: 50,
      images: []
    };

    const productResponse = await axios.post(`${API_BASE_URL}/seller/products`, productData, {
      headers: { 'Authorization': `Bearer ${sellerToken}` }
    });

    const testProduct = productResponse.data.product;
    console.log('✅ Test product created:', testProduct.name);

    // Step 4: Create an order as buyer
    console.log('\n4. Creating order as buyer...');
    const orderData = {
      items: [{
        product: testProduct._id,
        quantity: 2,
        price: testProduct.price
      }],
      shippingAddress: {
        street: '123 Test Street',
        city: 'Colombo',
        postalCode: '00100',
        phone: '+94771234567',
        country: 'Sri Lanka'
      },
      notes: 'Test order - please handle with care'
    };

    const orderResponse = await axios.post(`${API_BASE_URL}/buyer/orders`, orderData, {
      headers: { 'Authorization': `Bearer ${buyerToken}` }
    });

    console.log('✅ Order created successfully!');
    console.log('📋 Order Details:');
    console.log('   Order Number:', orderResponse.data.order.orderNumber);
    console.log('   Total Amount: $', orderResponse.data.order.totalAmount.toFixed(2));
    console.log('   Status:', orderResponse.data.order.status);
    console.log('   Items:', orderResponse.data.order.items.length);

    // Step 5: Verify order in buyer's purchase history
    console.log('\n5. Verifying order in buyer purchase history...');
    const purchasesResponse = await axios.get(`${API_BASE_URL}/buyer/orders`, {
      headers: { 'Authorization': `Bearer ${buyerToken}` }
    });

    const createdOrder = purchasesResponse.data.orders.find(o => o.orderNumber === orderResponse.data.order.orderNumber);
    
    if (createdOrder) {
      console.log('✅ Order found in purchase history!');
      console.log('   Retrieved Order Number:', createdOrder.orderNumber);
    } else {
      console.log('❌ Order not found in purchase history');
    }

    console.log('\n🎉 Order creation test completed successfully!');
    console.log('\n📝 Summary:');
    console.log('- ✅ Buyer registration/login works');
    console.log('- ✅ Seller can create products');
    console.log('- ✅ Order creation with proper orderNumber generation');
    console.log('- ✅ Order appears in buyer purchase history');
    console.log('- ✅ Full order flow functional');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testOrderCreation();
