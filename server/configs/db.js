const mongoose = require('mongoose');// Import mongoose for MongoDB connection 

// tao ham connectDB để kết nối với MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);// Connect to MongoDB using the URI from environment variables
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;// xuat hàm connectDB để sử dụng ở nơi khác trong ứng dụng