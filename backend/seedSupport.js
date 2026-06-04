const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function seedSupportAgent() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if support agent already exists
    const existingAgent = await User.findOne({ 
      email: 'support@gmail.com',
      role: 'support' 
    });

    if (existingAgent) {
      console.log('Support agent already exists');
      process.exit(0);
    }

    // Create support agent
    const supportAgent = new User({
      name: 'Support Agent',
      email: 'support@gmail.com',
      password: 'support@123', // Will be hashed by the pre-save middleware
      role: 'support',
      phone: '+94771234567',
      address: {
        street: 'Support Center',
        city: 'Colombo',
        postalCode: '00100',
        country: 'Sri Lanka'
      }
    });

    await supportAgent.save();
    console.log('Support agent created successfully');
    console.log('Email: support@gmail.com');
    console.log('Password: support@123');

  } catch (error) {
    console.error('Error seeding support agent:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

seedSupportAgent();
