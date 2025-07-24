const { findUserByEmail, verifyPassword } = require('../services/auth.service');
const { signToken } = require('../utils/jwt.util');
const User = require('../models/user.model');
const bcrypt = require('bcryptjs');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await findUserByEmail(email);
    if (!user) return res.status(400).json({ message: "Email doesn't exist" });

    const match = await verifyPassword(password, user.password);
    if (!match) return res.status(400).json({ message: 'Incorrect password' });

    const token = signToken({ id: user._id, role: user.role });

    res.json({
      token,
      user: { id: user._id, name: user.name, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server Error: ' + err.message });
  }
};
exports.register = async (req, res) => {
    const { name, email, password, role } = req.body;
  
    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ message: 'Email already exists' });
  
      const hashed = await bcrypt.hash(password, 10);
      const newUser = await User.create({ name, email, password: hashed, role });
  
      res.status(201).json({
        message: 'User registered successfully',
        user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role }
      });
    } catch (err) {
      res.status(500).json({ message: 'Server Error: ' + err.message });
    }
  };

// Đổi mật khẩu khi đã đăng nhập
exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
  
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: "User doesn't exist" });
  
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Incorrect Password' });
  
      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();
  
      res.json({ message: 'Password changed successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Server Error: ' + err.message });
    }
  };

// Get current user profile
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: "User doesn't exist" });
    
    res.json({
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server Error: ' + err.message });
  }
};