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

// Student lấy quiz theo khóa học
router.get('/course/:courseId', verifyToken, authorizeRole('student'), getQuizByCourse);

// Instructor lấy quiz theo khóa học
router.get('/course/:courseId/instructor', verifyToken, authorizeRole('instructor', 'admin'), getQuizByCourseForInstructor);

// Instructor xem tổng kết quiz của 1 khóa học
router.get('/course/:courseId/summary', verifyToken, authorizeRole('instructor', 'admin'), getSummaryByCourse);

// Instructor duyệt hoàn thành khóa học cho học viên
router.post('/course/:courseId/approve/:studentId', verifyToken, authorizeRole('instructor', 'admin'), approveCourseCompletion);

// Instructor xem tiến độ quiz của học viên trong khóa học
router.get('/course/:courseId/student/:studentId', verifyToken, authorizeRole('instructor', 'admin'), getStudentQuizProgress);

// Instructor lấy toàn bộ quiz mình tạo
router.get('/instructor', verifyToken, authorizeRole('instructor', 'admin'), getQuizzesByInstructor);

// Student nộp quiz
router.post('/submit', verifyToken, authorizeRole('student'), submitQuiz);

// Instructor tạo quiz
router.post('/', verifyToken, authorizeRole('instructor', 'admin'), createQuiz);

// Instructor cập nhật quiz
router.put('/:quizId', verifyToken, authorizeRole('instructor', 'admin'), updateQuiz);

// Instructor xem bài nộp của một quiz (route động – đặt cuối)
router.get('/:quizId/submissions', verifyToken, authorizeRole('instructor', 'admin'), getSubmissionsByQuiz);

module.exports = router;


