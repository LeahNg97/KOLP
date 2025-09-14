const express = require('express');
const router = express.Router();
const {
  createShortQuestion,
  getShortQuestionsByCourseId,
  getShortQuestionById,
  updateShortQuestion,
  deleteShortQuestion,
  startShortQuestion,
  submitShortQuestion,
  getShortQuestionResults,
  getShortQuestionResultsByCourseId,
  getStudentShortQuestionProgress,
  getPendingGradingShortQuestions,
  getShortQuestionProgressForGrading,
  gradeShortQuestion
} = require('../controllers/shortQuestion.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Public routes (if needed)
// router.get('/public/short-questions/:id', getShortQuestionById);

// Protected routes
router.use((req, res, next) => {
  console.log('Short question middleware hit:', req.method, req.url);
  next();
}, verifyToken);

// Short Question CRUD
router.post('/', createShortQuestion);
router.get('/course/:courseId', getShortQuestionsByCourseId);
router.get('/:id', getShortQuestionById);
router.put('/:id', updateShortQuestion);
router.delete('/:id', deleteShortQuestion);

// Short Question Progress
router.post('/:id/start', startShortQuestion);
router.post('/:id/submit', (req, res, next) => {
  console.log('Submit route hit:', req.method, req.url);
  console.log('Body:', req.body);
  console.log('Params:', req.params);
  next();
}, submitShortQuestion);
router.get('/:id/results/:attemptId', getShortQuestionResults);
router.get('/:id/results', getShortQuestionResults);

// Results for instructors
router.get('/course/:courseId/results', getShortQuestionResultsByCourseId);

// Instructor routes to view student progress
router.get('/course/:courseId/student/:studentId', getStudentShortQuestionProgress);

// Manual grading routes for instructors
router.get('/course/:courseId/pending-grading', getPendingGradingShortQuestions);
router.get('/progress/:progressId/for-grading', getShortQuestionProgressForGrading);
router.post('/progress/:progressId/grade', gradeShortQuestion);

module.exports = router;
