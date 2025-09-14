const express = require('express');
const router = express.Router();
const lessonProgressController = require('../controllers/lessonProgress.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Apply auth middleware to all routes
router.use(verifyToken);

// Mark lesson as completed
router.post('/complete', lessonProgressController.markLessonCompleted);

// Mark lesson as incomplete
router.post('/incomplete', lessonProgressController.markLessonIncomplete);

// Get lesson progress for a student in a course
router.get('/course/:courseId', lessonProgressController.getLessonProgress);

// Get overall course progress for a student
router.get('/course/:courseId/progress', lessonProgressController.getCourseProgress);

// Update lesson access time
router.post('/access', lessonProgressController.updateLessonAccess);

// Instructor routes to view student progress
router.get('/course/:courseId/student/:studentId', lessonProgressController.getStudentLessonProgress);
router.get('/course/:courseId/student/:studentId/progress', lessonProgressController.getStudentCourseProgress);

module.exports = router;
