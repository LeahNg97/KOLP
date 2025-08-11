const User = require('../models/user.model');


exports.getAllUsers = async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
};


exports.updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const updated = await User.findByIdAndUpdate(id, { role }, { new: true });
  res.json(updated);
};


exports.deleteUser = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'User deleted' });
};

