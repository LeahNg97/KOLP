// routes/course.routes.js
const express = require('express');
const router = express.Router();

const {
  createCourse,
  getAllCourses,
  getActiveCourses,
  getCourseById,
  updateCourse,
  updateCourseStatus,
  adminUpdateCourseStatus,
  deleteCourse,
  getCoursesByInstructor,
  getSyllabus,
  syncCourseStats
} = require('../controllers/course.controller');

const { verifyToken, authorizeRole } = require('../middleware/auth.middleware');

/**
 * NOTE: Đặt các route cụ thể ( /my-courses, /:id/syllabus, /:id/admin-status, /:id/status )
 * TRƯỚC route động /:id để tránh bị “nuốt” path con.
 */

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Get all courses (admin/instructor view)
 *     tags: [Courses]
 *     responses:
 *       200:
 *         description: List of all courses
 */
router.get('/', getAllCourses);

/**
 * @swagger
 * /api/courses/active:
 *   get:
 *     summary: Get active & published courses (catalog for students)
 *     tags: [Courses]
 *     responses:
 *       200:
 *         description: List of active courses
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
 *       401:
 *         description: Unauthorized
 */
router.get('/my-courses', verifyToken, authorizeRole('instructor'), getCoursesByInstructor);

/**
 * @swagger
 * /api/courses/{id}/syllabus:
 *   get:
 *     summary: Get syllabus (modules & lessons) for a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Syllabus (modules + lessons)
 *       404:
 *         description: Course not found
 */
router.get('/:id/syllabus', verifyToken, getSyllabus);

// Sync course stats with actual data
router.post('/:courseId/sync-stats', verifyToken, authorizeRole('admin', 'instructor'), syncCourseStats);

/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Create a new course (metadata; optional seed modules/lessons)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               subtitle: { type: string }
 *               description: { type: string }
 *               level:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *               priceType:
 *                 type: string
 *                 enum: [free, paid]
 *                 default: free
 *               price: { type: number, minimum: 0, default: 0 }
 *               salePrice: { type: number, minimum: 0 }
 *               currency: { type: string, default: AUD }
 *               categoryId: { type: string }
 *               tagIds:
 *                 type: array
 *                 items: { type: string }
 *               thumbnailUrl: { type: string }
 *               promoVideoUrl: { type: string }
 *               introductionAssets:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     kind:
 *                       type: string
 *                       enum: [video, image, text]
 *                     url: { type: string }
 *                     title: { type: string }
 *                     description: { type: string }
 *                     textContent: { type: string }
 *               isPublished: { type: boolean, default: false }
 *               status:
 *                 type: string
 *                 enum: [pending, active, inactive, draft]
 *                 default: pending
 *               modules:
 *                 description: Optional seed syllabus on create
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title: { type: string }
 *                     summary: { type: string }
 *                     order: { type: number }
 *                     lessons:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title: { type: string }
 *                           description: { type: string }
 *                           order: { type: number }
 *                           contentType:
 *                             type: string
 *                             enum: [video, pdf, slide, text]
 *                           url: { type: string }
 *                           textContent: { type: string }
 *                           durationSec: { type: number }
 *                           isPreview: { type: boolean }
 *     responses:
 *       201:
 *         description: Course created successfully
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request
 */
router.post('/', verifyToken, authorizeRole('admin', 'instructor'), createCourse);

/**
 * @swagger
 * /api/courses/{id}/status:
 *   patch:
 *     summary: Update course status (Instructor) - allowed draft or pending
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, pending]
 *     responses:
 *       200:
 *         description: Updated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.patch('/:id/status', verifyToken, authorizeRole('admin', 'instructor'), updateCourseStatus);

/**
 * @swagger
 * /api/courses/{id}/admin-status:
 *   patch:
 *     summary: Update course status (Admin only) - active or inactive
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *               adminNote: { type: string }
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
 *   put:
 *     summary: Update course metadata (owner/admin)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               subtitle: { type: string }
 *               description: { type: string }
 *               level: { type: string, enum: [beginner, intermediate, advanced] }
 *               priceType: { type: string, enum: [free, paid] }
 *               price: { type: number }
 *               salePrice: { type: number }
 *               currency: { type: string }
 *               categoryId: { type: string }
 *               tagIds:
 *                 type: array
 *                 items: { type: string }
 *               thumbnailUrl: { type: string }
 *               promoVideoUrl: { type: string }
 *               introductionAssets:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     kind: { type: string, enum: [video, image, text] }
 *                     url: { type: string }
 *                     title: { type: string }
 *                     description: { type: string }
 *                     textContent: { type: string }
 *               isPublished: { type: boolean }
 *     responses:
 *       200:
 *         description: Course updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Course not found
 */
router.put('/:id', verifyToken, authorizeRole('admin', 'instructor'), updateCourse);

// Giữ 1 alias PATCH nếu bạn vẫn dùng từ FE
router.patch('/:id', verifyToken, authorizeRole('admin', 'instructor'), updateCourse);

/**
 * @swagger
 * /api/courses/{id}:
 *   get:
 *     summary: Get course by ID
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Course details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Course not found
 */
router.get('/:id', verifyToken, getCourseById);

/**
 * @swagger
 * /api/courses/{id}:
 *   delete:
 *     summary: Delete course (cascade modules & lessons)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
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
