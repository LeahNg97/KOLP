const express = require('express');
const router = express.Router();
const {
  enrollCourse,
  getMyEnrollments,
  getStudentsByCourse,
  getInstructorStudents,
  approveEnrollment,
  cancelEnrollment,
  rejectEnrollment
} = require('../controllers/enrollment.controller');

const { verifyToken, authorizeRole } = require('../middleware/auth.middleware');

// Sinh viên đăng ký khóa học
router.post('/', verifyToken, authorizeRole('student'), enrollCourse);

// Sinh viên xem khóa học của mình
router.get('/my-courses', verifyToken, authorizeRole('student'), getMyEnrollments);

// Instructor/Admin xem danh sách sinh viên trong khóa học
router.get('/by-course/:courseId/students', verifyToken, authorizeRole('admin', 'instructor'), getStudentsByCourse);

// Instructor xem tất cả sinh viên đăng ký khóa học của mình
router.get('/instructor-students', verifyToken, authorizeRole('instructor'), getInstructorStudents);

// Instructor/Admin duyệt đăng ký
router.put('/:enrollmentId/approve', verifyToken, authorizeRole('admin', 'instructor'), approveEnrollment);

// Instructor/Admin từ chối đăng ký
router.delete('/:enrollmentId/reject', verifyToken, authorizeRole('admin', 'instructor'), rejectEnrollment);

// Student hủy đăng ký khóa học
router.delete('/:enrollmentId', verifyToken, authorizeRole('student'), cancelEnrollment);

module.exports = router;