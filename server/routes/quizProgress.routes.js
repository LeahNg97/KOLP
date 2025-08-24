const express = require('express');
const router = express.Router();
const {
  getQuizProgress,
  startQuiz,
  submitQuiz,
  getQuizResults,
  getCourseProgress
} = require('../controllers/quizProgress.controller');
const { verifyToken, authorizeRole } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(verifyToken);

// Student routes
router.get('/courses/:courseId/progress', getQuizProgress);
router.get('/courses/:courseId/progress/summary', getCourseProgress);
router.post('/courses/:courseId/start', startQuiz);
router.post('/courses/:courseId/submit', submitQuiz);
router.get('/courses/:courseId/results', getQuizResults);

module.exports = router;
