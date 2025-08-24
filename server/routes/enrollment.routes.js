const express = require('express');
const router = express.Router();
const {
  enrollCourse,
  getMyEnrollments,
  getStudentsByCourse,
  getInstructorStudents,
  approveEnrollment,
  cancelEnrollment,
  rejectEnrollment,
  deleteEnrollment,
  approveCourseCompletion
} = require('../controllers/enrollment.controller');

const { verifyToken, authorizeRole } = require('../middleware/auth.middleware');

/**
 * @swagger
 * /api/enrollments:
 *   post:
 *     summary: Enroll in a course (Student only)
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *             properties:
 *               courseId:
 *                 type: string
 *                 description: Course ID to enroll in
 *     responses:
 *       201:
 *         description: Enrollment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Enrollment'
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request
 */
router.post('/', verifyToken, authorizeRole('student'), enrollCourse);

/**
 * @swagger
 * /api/enrollments/my-courses:
 *   get:
 *     summary: Get current user's enrolled courses (Student only)
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of enrolled courses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Enrollment'
 *       401:
 *         description: Unauthorized
 */
router.get('/my-courses', verifyToken, authorizeRole('student'), getMyEnrollments);

/**
 * @swagger
 * /api/enrollments/by-course/{courseId}/students:
 *   get:
 *     summary: Get students enrolled in a specific course (Instructor/Admin only)
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: List of enrolled students
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   studentId:
 *                     type: string
 *                   studentName:
 *                     type: string
 *                   status:
 *                     type: string
 *                   enrolledAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get('/by-course/:courseId/students', verifyToken, authorizeRole('admin', 'instructor'), getStudentsByCourse);

/**
 * @swagger
 * /api/enrollments/instructor-students:
 *   get:
 *     summary: Get all students enrolled in instructor's courses (Instructor only)
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of students in instructor's courses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   studentId:
 *                     type: string
 *                   studentName:
 *                     type: string
 *                   courseId:
 *                     type: string
 *                   courseTitle:
 *                     type: string
 *                   status:
 *                     type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/instructor-students', verifyToken, authorizeRole('instructor'), getInstructorStudents);

/**
 * @swagger
 * /api/enrollments/{enrollmentId}/approve:
 *   put:
 *     summary: Approve enrollment (Instructor/Admin only)
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: enrollmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Enrollment ID
 *     responses:
 *       200:
 *         description: Enrollment approved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Enrollment not found
 */
router.put('/:enrollmentId/approve', verifyToken, authorizeRole('admin', 'instructor'), approveEnrollment);

/**
 * @swagger
 * /api/enrollments/{enrollmentId}/delete:
 *   delete:
 *     summary: Delete enrollment (Admin/Instructor only)
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: enrollmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Enrollment ID
 *     responses:
 *       200:
 *         description: Enrollment deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized
 *       404:
 *         description: Enrollment not found
 */
router.delete('/:enrollmentId/delete', verifyToken, authorizeRole('admin', 'instructor'), deleteEnrollment);

/**
 * @swagger
 * /api/enrollments/{enrollmentId}/reject:
 *   delete:
 *     summary: Reject enrollment (Instructor/Admin only)
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: enrollmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Enrollment ID
 *     responses:
 *       200:
 *         description: Enrollment rejected successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Enrollment not found
 */
router.delete('/:enrollmentId/reject', verifyToken, authorizeRole('admin', 'instructor'), rejectEnrollment);

/**
 * @swagger
 * /api/enrollments/{enrollmentId}:
 *   delete:
 *     summary: Cancel enrollment (Student only)
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: enrollmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Enrollment ID
 *     responses:
 *       200:
 *         description: Enrollment cancelled successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Enrollment not found
 */
router.delete('/:enrollmentId', verifyToken, authorizeRole('student'), cancelEnrollment);

/**
 * @swagger
 * /api/enrollments/{courseId}/approve-completion/{studentId}:
 *   patch:
 *     summary: Approve course completion for a student (Instructor/Admin only)
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Course completion approved successfully
 *       400:
 *         description: Student has not completed all lessons
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not instructor of this course
 *       404:
 *         description: Enrollment not found
 */
router.patch('/:courseId/approve-completion/:studentId', verifyToken, authorizeRole('admin', 'instructor'), approveCourseCompletion);

module.exports = router;
