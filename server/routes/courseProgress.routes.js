const express = require('express');
const { getCourseProgressBreakdown, updateCourseProgress } = require('../controllers/courseProgress.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes are protected
router.use(verifyToken);

// @route   GET /api/course-progress/:courseId
// @desc    Get detailed course progress breakdown
// @access  Private (Student)
router.get('/:courseId', getCourseProgressBreakdown);

// @route   POST /api/course-progress/:courseId/update
// @desc    Update course progress
// @access  Private (Student)
router.post('/:courseId/update', updateCourseProgress);

module.exports = router;
