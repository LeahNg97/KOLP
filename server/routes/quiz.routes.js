const express = require('express');
const router = express.Router();
const {
  getQuizzesByCourse,
  getQuizSummary,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  toggleQuizPublished,
  getQuizById
} = require('../controllers/quiz.controller');
const { verifyToken, authorizeRole } = require('../middleware/auth.middleware');

// Public routes (no auth required)
router.get('/courses/:courseId/quizzes', getQuizzesByCourse);
router.get('/courses/:courseId/quizzes/summary', getQuizSummary);
router.get('/:id', getQuizById);

// Protected routes (require authentication)
router.use(verifyToken);

// Instructor only routes
router.post('/', authorizeRole('instructor'), createQuiz);
router.put('/:id', authorizeRole('instructor'), updateQuiz);
router.delete('/:id', authorizeRole('instructor'), deleteQuiz);
router.patch('/:id/toggle-published', authorizeRole('instructor'), toggleQuizPublished);

module.exports = router;
