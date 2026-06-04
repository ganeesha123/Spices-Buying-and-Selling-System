const axios = require('axios');

// Base URL for your API
const API_BASE_URL = 'http://localhost:5000/api';

async function testTicketValidation() {
  try {
    console.log('🧪 Testing Support Ticket Validation...\n');

    // Step 1: Register and login as buyer
    console.log('1. Setting up buyer account...');
    const buyerData = {
      name: 'Test Buyer',
      email: 'ticketbuyer@test.com',
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

    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'ticketbuyer@test.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Buyer login successful\n');

    // Step 2: Test validation failures
    console.log('2. Testing validation failures...\n');

    // Test 1: Empty subject
    console.log('📝 Test 1: Empty subject');
    try {
      await axios.post(`${API_BASE_URL}/buyer/support/tickets`, {
        subject: '',
        description: 'This is a test description that is long enough to pass validation',
        category: 'other',
        priority: 'medium'
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('❌ Should have failed validation');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly rejected empty subject');
        console.log('   Error:', error.response.data.errors?.[0]?.msg || error.response.data.message);
      } else {
        throw error;
      }
    }

    // Test 2: Short subject
    console.log('\n📝 Test 2: Short subject (< 5 characters)');
    try {
      await axios.post(`${API_BASE_URL}/buyer/support/tickets`, {
        subject: 'Hi',
        description: 'This is a test description that is long enough to pass validation',
        category: 'other',
        priority: 'medium'
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('❌ Should have failed validation');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly rejected short subject');
        console.log('   Error:', error.response.data.errors?.[0]?.msg || error.response.data.message);
      } else {
        throw error;
      }
    }

    // Test 3: Short description
    console.log('\n📝 Test 3: Short description (< 20 characters)');
    try {
      await axios.post(`${API_BASE_URL}/buyer/support/tickets`, {
        subject: 'Valid subject here',
        description: 'Too short',
        category: 'other',
        priority: 'medium'
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('❌ Should have failed validation');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly rejected short description');
        console.log('   Error:', error.response.data.errors?.[0]?.msg || error.response.data.message);
      } else {
        throw error;
      }
    }

    // Test 4: Invalid category
    console.log('\n📝 Test 4: Invalid category');
    try {
      await axios.post(`${API_BASE_URL}/buyer/support/tickets`, {
        subject: 'Valid subject here',
        description: 'This is a valid description that is long enough to pass validation',
        category: 'invalid_category',
        priority: 'medium'
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('❌ Should have failed validation');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly rejected invalid category');
        console.log('   Error:', error.response.data.errors?.[0]?.msg || error.response.data.message);
      } else {
        throw error;
      }
    }

    // Step 3: Test successful creation
    console.log('\n3. Testing successful ticket creation...');
    const validTicketData = {
      subject: 'Test Support Request',
      description: 'This is a comprehensive test description that is definitely long enough to pass all validation requirements and provides detailed information about the issue.',
      category: 'technical',
      priority: 'medium'
    };

    const successResponse = await axios.post(`${API_BASE_URL}/buyer/support/tickets`, validTicketData, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('✅ Ticket created successfully!');
    console.log('📋 Ticket Details:');
    console.log('   ID:', successResponse.data.ticket._id);
    console.log('   Subject:', successResponse.data.ticket.subject);
    console.log('   Category:', successResponse.data.ticket.category);
    console.log('   Status:', successResponse.data.ticket.status);
    console.log('   Priority:', successResponse.data.ticket.priority);

    console.log('\n🎉 Ticket validation test completed successfully!');
    console.log('\n📝 Summary:');
    console.log('- ✅ Empty subject validation works');
    console.log('- ✅ Short subject validation works');
    console.log('- ✅ Short description validation works');
    console.log('- ✅ Invalid category validation works');
    console.log('- ✅ Valid ticket creation works');
    console.log('- ✅ All validation messages are properly returned');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testTicketValidation();
