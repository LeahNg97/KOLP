const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRole } = require('../middleware/auth.middleware');

// Import module controller (sẽ tạo sau)
const {
  createModule,
  getModulesByCourse,
  getModuleById,
  updateModule,
  deleteModule
} = require('../controllers/module.controller');

/**
 * @swagger
 * /api/modules:
 *   post:
 *     summary: Create a new module
 *     tags: [Modules]
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
 *               - title
 *               - order
 *             properties:
 *               courseId:
 *                 type: string
 *                 description: Course ID
 *               title:
 *                 type: string
 *                 description: Module title
 *               summary:
 *                 type: string
 *                 description: Module summary
 *               order:
 *                 type: number
 *                 description: Module order
 *     responses:
 *       201:
 *         description: Module created successfully
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request
 */
router.post('/', verifyToken, authorizeRole('admin', 'instructor'), createModule);

/**
 * @swagger
 * /api/modules/course/{courseId}:
 *   get:
 *     summary: Get all modules for a course
 *     tags: [Modules]
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
 *         description: List of modules
 *       401:
 *         description: Unauthorized
 */
router.get('/course/:courseId', verifyToken, getModulesByCourse);

/**
 * @swagger
 * /api/modules/{id}:
 *   get:
 *     summary: Get module by ID
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Module ID
 *     responses:
 *       200:
 *         description: Module details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Module not found
 */
router.get('/:id', verifyToken, getModuleById);

/**
 * @swagger
 * /api/modules/{id}:
 *   put:
 *     summary: Update module
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Module ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               summary:
 *                 type: string
 *               order:
 *                 type: number
 *     responses:
 *       200:
 *         description: Module updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Module not found
 */
router.put('/:id', verifyToken, authorizeRole('admin', 'instructor'), updateModule);

/**
 * @swagger
 * /api/modules/{id}:
 *   delete:
 *     summary: Delete module
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Module ID
 *     responses:
 *       200:
 *         description: Module deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Module not found
 */
router.delete('/:id', verifyToken, authorizeRole('admin', 'instructor'), deleteModule);

module.exports = router;
