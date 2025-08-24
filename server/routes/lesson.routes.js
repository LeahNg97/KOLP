const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRole } = require('../middleware/auth.middleware');

// Import lesson controller (sẽ tạo sau)
const {
  createLesson,
  getLessonsByModule,
  getLessonById,
  updateLesson,
  deleteLesson
} = require('../controllers/lesson.controller');

/**
 * @swagger
 * /api/lessons:
 *   post:
 *     summary: Create a new lesson
 *     tags: [Lessons]
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
 *               - moduleId
 *               - title
 *               - order
 *             properties:
 *               courseId:
 *                 type: string
 *                 description: Course ID
 *               moduleId:
 *                 type: string
 *                 description: Module ID
 *               title:
 *                 type: string
 *                 description: Lesson title
 *               description:
 *                 type: string
 *                 description: Lesson description
 *               contentType:
 *                 type: string
 *                 enum: [video, pdf, slide, text]
 *                 description: Type of content
 *               url:
 *                 type: string
 *                 description: Content URL
 *               textContent:
 *                 type: string
 *                 description: Text content for text lessons
 *               durationSec:
 *                 type: number
 *                 description: Duration in seconds
 *               order:
 *                 type: number
 *                 description: Lesson order
 *               isPreview:
 *                 type: boolean
 *                 description: Whether lesson is preview
 *     responses:
 *       201:
 *         description: Lesson created successfully
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request
 */
router.post('/', verifyToken, authorizeRole('admin', 'instructor'), createLesson);

/**
 * @swagger
 * /api/lessons/module/{moduleId}:
 *   get:
 *     summary: Get all lessons for a module
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Module ID
 *     responses:
 *       200:
 *         description: List of lessons
 *       401:
 *         description: Unauthorized
 */
router.get('/module/:moduleId', verifyToken, getLessonsByModule);

/**
 * @swagger
 * /api/lessons/{id}:
 *   get:
 *     summary: Get lesson by ID
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Lesson ID
 *     responses:
 *       200:
 *         description: Lesson details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Lesson not found
 */
router.get('/:id', verifyToken, getLessonById);

/**
 * @swagger
 * /api/lessons/{id}:
 *   put:
 *     summary: Update lesson
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Lesson ID
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
 *               contentType:
 *                 type: string
 *               url:
 *                 type: string
 *               textContent:
 *                 type: string
 *               durationSec:
 *                 type: number
 *               order:
 *                 type: number
 *               isPreview:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Lesson updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Lesson not found
 */
router.put('/:id', verifyToken, authorizeRole('admin', 'instructor'), updateLesson);

/**
 * @swagger
 * /api/lessons/{id}:
 *   delete:
 *     summary: Delete lesson
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Lesson ID
 *     responses:
 *       200:
 *         description: Lesson deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Lesson not found
 */
router.delete('/:id', verifyToken, authorizeRole('admin', 'instructor'), deleteLesson);

module.exports = router;
