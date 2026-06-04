const mongoose = require('mongoose');
require('dotenv').config();

console.log('Testing MongoDB Atlas connection...');
console.log('Connection string:', process.env.MONGODB_URI.replace(/:[^:@]*@/, ':****@'));

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB Atlas connected successfully!');
  console.log('Database:', mongoose.connection.db.databaseName);
  process.exit(0);
})
.catch(err => {
  console.error('❌ MongoDB Atlas connection error:', err.message);
  console.log('\n🔧 Troubleshooting tips:');
  console.log('1. Check your internet connection');
  console.log('2. Verify your MongoDB Atlas connection string in .env');
  console.log('3. Ensure your IP is whitelisted in MongoDB Atlas');
  console.log('4. Check username/password in connection string');
  console.log('5. Make sure your cluster is active (not paused)');
  process.exit(1);
});
