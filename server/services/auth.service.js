
// truy vấn bảng user trong MongoDB để tìm kiếm người dùng theo email và xác thực mật khẩu
const User = require('../models/user.model');
const bcrypt = require('bcryptjs');// Import bcrypt for password hashing and comparison

async function findUserByEmail(email) {// Find a user by email in the database
  // This function queries the User model to find a user document with the specified email
  return await User.findOne({ email });
}

async function verifyPassword(input, hash) {// Verify the input password against the stored hash
  // This function uses bcrypt to compare the input password with the hashed password stored in the database
  // It returns true if the passwords match, otherwise false
  return await bcrypt.compare(input, hash);
}

module.exports = {// Export the functions for use in other parts of the application, xuất ra để dùng trong file khác
  findUserByEmail,
  verifyPassword
};