require('dotenv').config();// Load environment variables from .env file, lấy các biến môi trường từ file .env
const express = require('express');// Import express for routing, thư viện của Node.js để xây dựng ứng dụng web
const cors = require('cors');// middleware to enable CORS (Cross-Origin Resource Sharing), cho phép các yêu cầu từ các nguồn khác nhau
const connectDB = require('./Configs/DB');// Import the database connection function, kết nối tới MongoDB
const authRoutes = require('./routes/auth.routes');// Import authentication routes, các route liên quan đến xác thực người dùng

// cấu hình express app, khởi tạo ứng dụng express
const app = express();
app.use(cors()); // Enable CORS for all routes, cho phép tất cả các nguồn truy cập vào ứng dụng, 
app.use(express.json());// Parse JSON request bodies, phân tích cú pháp các yêu cầu JSON từ client

// Routes
app.use('/api/auth', authRoutes);// Use authentication routes, sử dụng các route xác thực người dùng

app.get('/', (req, res) => res.send('KOLP Backend is running'));// Root route to check if the server is running, route gốc để kiểm tra xem server có đang chạy hay không

const PORT = process.env.PORT || 5000;// 1 port to run the server, nếu không có biến môi trường PORT thì sử dụng 5000, 1 port lấy từ env hoặc 5000 nếu không có

// Connect to the database and start the server
// Kết nối tới cơ sở dữ liệu và khởi động server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});