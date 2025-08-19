const express = require('express');
const router = express.Router();
const {
  getAllCourses,
  getActiveCourses,
  getCourseById,
  createCourse,
  updateCourse,
  adminUpdateCourseStatus,
  deleteCourse,
  getCoursesByInstructor
} = require('../controllers/course.controller');

const { verifyToken, authorizeRole } = require('../middleware/auth.middleware');

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Get all courses
 *     tags: [Courses]
 *     responses:
 *       200:
 *         description: List of all courses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Course'
 */
router.get('/', getAllCourses);

/**
 * @swagger
 * /api/courses/active:
 *   get:
 *     summary: Get active courses only
 *     tags: [Courses]
 *     responses:
 *       200:
 *         description: List of active courses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Course'
 */
router.get('/active', getActiveCourses);

/**
 * @swagger
 * /api/courses/my-courses:
 *   get:
 *     summary: Get courses by current instructor
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of instructor's courses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Course'
 *       401:
 *         description: Unauthorized
 */
router.get('/my-courses', verifyToken, authorizeRole('instructor'), getCoursesByInstructor);

/**
 * @swagger
 * /api/courses/{id}:
 *   get:
 *     summary: Get course by ID
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course'
 *       404:
 *         description: Course not found
 */
router.get('/:id', getCourseById);

/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 default: 0
 *                 description: Course price (0 for free courses)
 *               introductionContent:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [video, image, text]
 *                     url:
 *                       type: string
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *               sections:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     order:
 *                       type: number
 *                     lessons:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                           description:
 *                             type: string
 *                           type:
 *                             type: string
 *                             enum: [video, pdf, slide, text]
 *                           url:
 *                             type: string
 *                           duration:
 *                             type: number
 *                           order:
 *                             type: number
 *               imageIntroduction:
 *                 type: string
 *     responses:
 *       201:
 *         description: Course created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course'
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request
 */
router.post('/', verifyToken, authorizeRole('admin', 'instructor'), createCourse);

/**
 * @swagger
 * /api/courses/{id}:
 *   put:
 *     summary: Update course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               introductionContent:
 *                 type: array
 *               sections:
 *                 type: array
 *               imageIntroduction:
 *                 type: string
 *     responses:
 *       200:
 *         description: Course updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Course not found
 */
router.put('/:id', verifyToken, authorizeRole('admin', 'instructor'), updateCourse);
router.patch('/:id', verifyToken, authorizeRole('admin', 'instructor'), updateCourse);

/**
 * @swagger
 * /api/courses/{id}/admin-status:
 *   patch:
 *     summary: Update course status (Admin only)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, active, inactive, draft]
 *               adminNote:
 *                 type: string
 *     responses:
 *       200:
 *         description: Course status updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.patch('/:id/admin-status', verifyToken, authorizeRole('admin'), adminUpdateCourseStatus);

/**
 * @swagger
 * /api/courses/{id}:
 *   delete:
 *     summary: Delete course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Course not found
 */
router.delete('/:id', verifyToken, authorizeRole('admin', 'instructor'), deleteCourse);

module.exports = router;
