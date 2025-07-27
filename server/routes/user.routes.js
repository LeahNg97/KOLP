const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRole } = require('../middleware/auth.middleware');
const { getAllUsers, updateUserRole, deleteUser } = require('../controllers/user.controller');

router.get('/me', verifyToken, (req, res) => {
  res.json({
    message: 'Bạn đã đăng nhập',
    user: req.user
  });
});

// Route chỉ dành cho admin:
router.get('/admin-only', verifyToken, authorizeRole('admin'), (req, res) => {
  res.json({ message: 'Bạn là admin!' });
});


router.get('/', verifyToken, authorizeRole('admin'), getAllUsers);

router.put('/:id/role', verifyToken, authorizeRole('admin'), updateUserRole);

router.delete('/:id', verifyToken, authorizeRole('admin'), deleteUser);

module.exports = router;


// Get, set, update, delete