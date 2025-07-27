const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getInstructorStats,
  getStudentStats
} = require('../controllers/dashboard.controller');

const { verifyToken, authorizeRole } = require('../middleware/auth.middleware');

router.get('/admin', verifyToken, authorizeRole('admin'), getAdminStats);
router.get('/instructor', verifyToken, authorizeRole('instructor'), getInstructorStats);
router.get('/student', verifyToken, authorizeRole('student'), getStudentStats);

module.exports = router;