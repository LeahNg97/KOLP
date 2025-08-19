const User = require('../models/user.model');
const bcrypt = require('bcryptjs');

async function findUserByEmail(email) {
  return await User.findOne({ email });
}

async function verifyPassword(input, hash) {
  return await bcrypt.compare(input, hash);
}

module.exports = {
  findUserByEmail,
  verifyPassword
};
