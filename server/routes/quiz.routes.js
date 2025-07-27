const express = require('express');
const router = express.Router();
const {
  createQuiz,
  getQuizByCourse,
  getQuizByCourseForInstructor,
  submitQuiz,
  getSubmissionsByQuiz,
  getSummaryByCourse,
  updateQuiz,
  approveCourseCompletion,
  getStudentQuizProgress,
  getQuizzesByInstructor
} = require('../controllers/quiz.controller');

const { verifyToken, authorizeRole } = require('../middleware/auth.middleware');

// Instructor tạo quiz
router.post('/', verifyToken, authorizeRole('instructor', 'admin'), createQuiz);

// Instructor cập nhật quiz
router.put('/:quizId', verifyToken, authorizeRole('instructor', 'admin'), updateQuiz);

// Student lấy quiz
router.get('/course/:courseId', verifyToken, authorizeRole('student'), getQuizByCourse);

// Instructor lấy quiz
router.get('/course/:courseId/instructor', verifyToken, authorizeRole('instructor', 'admin'), getQuizByCourseForInstructor);

// Lấy tất cả quiz của instructor hiện tại
router.get('/instructor', verifyToken, authorizeRole('instructor', 'admin'), getQuizzesByInstructor);

// Student nộp bài
router.post('/submit', verifyToken, authorizeRole('student'), submitQuiz);

// Instructor xem bài nộp
router.get('/:quizId/submissions', verifyToken, authorizeRole('instructor', 'admin'), getSubmissionsByQuiz);

router.get('/course/:courseId/summary', verifyToken, authorizeRole('instructor', 'admin'), getSummaryByCourse);

// Instructor approve course completion
router.post('/course/:courseId/approve/:studentId', verifyToken, authorizeRole('instructor', 'admin'), approveCourseCompletion);

// Instructor fetches a student's quiz progress in a course
router.get('/course/:courseId/student/:studentId', verifyToken, authorizeRole('instructor', 'admin'), getStudentQuizProgress);

module.exports = router;