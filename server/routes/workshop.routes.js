// routes/workshop.routes.js
const express = require('express');
const router = express.Router();

const {
  createWorkshop,
  getAllWorkshops,
  getPublishedWorkshops,
  getWorkshopById,
  updateWorkshop,
  deleteWorkshop,
  getWorkshopsByInstructor,
  updateWorkshopStatus,
  searchWorkshops
} = require('../controllers/workshop.controller');

const { verifyToken, authorizeRole } = require('../middleware/auth.middleware');

/**
 * @swagger
 * /api/workshops:
 *   get:
 *     summary: Get all workshops (admin/instructor view)
 *     tags: [Workshops]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all workshops
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Workshop'
 */
router.get('/', verifyToken, authorizeRole(['admin', 'instructor']), getAllWorkshops);

/**
 * @swagger
 * /api/workshops/published:
 *   get:
 *     summary: Get published workshops (public catalog)
 *     tags: [Workshops]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, live, completed, canceled]
 *         description: Filter by workshop status
 *       - in: query
 *         name: instructorId
 *         schema:
 *           type: string
 *         description: Filter by instructor ID
 *       - in: query
 *         name: upcoming
 *         schema:
 *           type: boolean
 *         description: Show only upcoming workshops
 *     responses:
 *       200:
 *         description: List of published workshops
 */
router.get('/published', getPublishedWorkshops);

/**
 * @swagger
 * /api/workshops/search:
 *   get:
 *     summary: Search workshops
 *     tags: [Workshops]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, live, completed, canceled]
 *         description: Filter by workshop status
 *       - in: query
 *         name: instructorId
 *         schema:
 *           type: string
 *         description: Filter by instructor ID
 *       - in: query
 *         name: upcoming
 *         schema:
 *           type: boolean
 *         description: Show only upcoming workshops
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/search', searchWorkshops);

/**
 * @swagger
 * /api/workshops:
 *   post:
 *     summary: Create a new workshop
 *     tags: [Workshops]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WorkshopInput'
 *     responses:
 *       201:
 *         description: Workshop created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/', verifyToken, authorizeRole(['instructor', 'admin']), createWorkshop);

/**
 * @swagger
 * /api/workshops/instructor/{instructorId}:
 *   get:
 *     summary: Get workshops by instructor
 *     tags: [Workshops]
 *     parameters:
 *       - in: path
 *         name: instructorId
 *         required: true
 *         schema:
 *           type: string
 *         description: Instructor ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, live, completed, canceled]
 *         description: Filter by workshop status
 *       - in: query
 *         name: published
 *         schema:
 *           type: boolean
 *         description: Show only published workshops
 *     responses:
 *       200:
 *         description: List of workshops by instructor
 */
router.get('/instructor/:instructorId', getWorkshopsByInstructor);

/**
 * @swagger
 * /api/workshops/{id}:
 *   get:
 *     summary: Get workshop by ID
 *     tags: [Workshops]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Workshop ID
 *     responses:
 *       200:
 *         description: Workshop details
 *       404:
 *         description: Workshop not found
 */
router.get('/:id', getWorkshopById);

/**
 * @swagger
 * /api/workshops/{id}:
 *   put:
 *     summary: Update workshop
 *     tags: [Workshops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Workshop ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WorkshopInput'
 *     responses:
 *       200:
 *         description: Workshop updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Workshop not found
 */
router.put('/:id', verifyToken, authorizeRole(['instructor', 'admin']), updateWorkshop);

/**
 * @swagger
 * /api/workshops/{id}/status:
 *   patch:
 *     summary: Update workshop status
 *     tags: [Workshops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Workshop ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [scheduled, live, completed, canceled]
 *                 required: true
 *     responses:
 *       200:
 *         description: Workshop status updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Workshop not found
 */
router.patch('/:id/status', verifyToken, authorizeRole(['instructor', 'admin']), updateWorkshopStatus);

/**
 * @swagger
 * /api/workshops/{id}:
 *   delete:
 *     summary: Delete workshop
 *     tags: [Workshops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Workshop ID
 *     responses:
 *       200:
 *         description: Workshop deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Workshop not found
 */
router.delete('/:id', verifyToken, authorizeRole(['instructor', 'admin']), deleteWorkshop);

module.exports = router;