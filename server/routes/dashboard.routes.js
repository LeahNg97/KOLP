const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getInstructorStats,
  getStudentStats
} = require('../controllers/dashboard.controller');

const { verifyToken, authorizeRole } = require('../middleware/auth.middleware');

/**
 * @swagger
 * /api/dashboard/admin:
 *   get:
 *     summary: Get admin dashboard statistics (Admin only)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: number
 *                 totalCourses:
 *                   type: number
 *                 totalEnrollments:
 *                   type: number
 *                 totalCertificates:
 *                   type: number
 *                 pendingCourses:
 *                   type: number
 *                 activeCourses:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/admin', verifyToken, authorizeRole('admin'), getAdminStats);

/**
 * @swagger
 * /api/dashboard/instructor:
 *   get:
 *     summary: Get instructor dashboard statistics (Instructor only)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Instructor dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalCourses:
 *                   type: number
 *                 totalStudents:
 *                   type: number
 *                 totalEnrollments:
 *                   type: number
 *                 pendingEnrollments:
 *                   type: number
 *                 completedCourses:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Instructor access required
 */
router.get('/instructor', verifyToken, authorizeRole('instructor'), getInstructorStats);

/**
 * @swagger
 * /api/dashboard/student:
 *   get:
 *     summary: Get student dashboard statistics (Student only)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 enrolledCourses:
 *                   type: number
 *                 completedCourses:
 *                   type: number
 *                 totalCertificates:
 *                   type: number
 *                 pendingEnrollments:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Student access required
 */
router.get('/student', verifyToken, authorizeRole('student'), getStudentStats);

module.exports = router;
