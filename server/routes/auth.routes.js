
const express = require('express');// Import express for routing
const router = express.Router();// Create a new router instance for handling authentication routes
const { login, register, changePassword, getMe } = require('../controllers/auth.controller');// Import authentication controller functions for handling login, registration, and password change
const { verifyToken } = require('../middleware/auth.middleware');// Import middleware for verifying JWT tokens to protect routes

// Define routes for authentication
// These routes handle user login, registration, and password change operations
// The login route allows users to authenticate and receive a JWT token
// The register route allows new users to create an account
// The changePassword route allows authenticated users to change their password
// The verifyToken middleware is applied to the changePassword route to ensure the user is authenticated
// The login and register routes do not require authentication, so they do not use the verifyToken
router.post('/login', login);
router.post('/register', register);
router.put('/change-password', verifyToken, changePassword); 
router.get('/me', verifyToken, getMe);// Route to get the current user's profile, protected by token verification

module.exports = router;

// tạo các endpoints. post là dữ liệu từ client gửi lên server
// post là gửi dữ liệu từ client lên server, put là cập nhật dữ liệu trên server