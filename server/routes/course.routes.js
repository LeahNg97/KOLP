const express = require('express');
const router = express.Router();
const {
  getAllCourses,
  getActiveCourses,
  getCourseById,
  createCourse,
  updateCourse,
  adminUpdateCourseStatus,
  deleteCourse,
  getCoursesByInstructor
} = require('../controllers/course.controller');

const { verifyToken, authorizeRole } = require('../middleware/auth.middleware');

// Public
router.get('/', getAllCourses);
router.get('/active', getActiveCourses);

// Instructor only
router.get('/my-courses', verifyToken, authorizeRole('instructor'), getCoursesByInstructor);

// Get course by ID (must come after specific routes)
router.get('/:id', getCourseById);

// Admin/instructor only
router.post('/', verifyToken, authorizeRole('admin', 'instructor'), createCourse);
router.put('/:id', verifyToken, authorizeRole('admin', 'instructor'), updateCourse);
router.patch('/:id', verifyToken, authorizeRole('admin', 'instructor'), updateCourse);
// Note: Course status management is admin-only
// router.patch('/:id/status', verifyToken, authorizeRole('admin', 'instructor'), updateCourseStatus);
router.patch('/:id/admin-status', verifyToken, authorizeRole('admin'), adminUpdateCourseStatus);
router.delete('/:id', verifyToken, authorizeRole('admin', 'instructor'), deleteCourse);

module.exports = router;