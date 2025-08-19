const express = require('express');
const router = express.Router();
const Certificate = require('../models/certificate.model');
const { verifyToken, authorizeRole } = require('../middleware/auth.middleware');
const { 
  getMyCertificates, 
  issueCertificate, 
  issueCertificateForCompletedCourse, 
  getCertificateById,
  getAllCertificates 
} = require('../controllers/certificate.controller');

/**
 * @swagger
 * /api/certificates:
 *   get:
 *     summary: Get current user's certificates (Student only)
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's certificates
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Certificate'
 *       401:
 *         description: Unauthorized
 */
router.get('/', verifyToken, authorizeRole('student'), getMyCertificates);

/**
 * @swagger
 * /api/certificates/all:
 *   get:
 *     summary: Get all certificates (Admin only)
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all certificates
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Certificate'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/all', verifyToken, authorizeRole('admin'), getAllCertificates);

/**
 * @swagger
 * /api/certificates/issue:
 *   post:
 *     summary: Issue a certificate (Instructor/Admin only)
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *               - courseId
 *             properties:
 *               studentId:
 *                 type: string
 *               courseId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Certificate issued successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Certificate'
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request
 */
router.post('/issue', verifyToken, authorizeRole('instructor', 'admin'), issueCertificate);

/**
 * @swagger
 * /api/certificates/issue-completed:
 *   post:
 *     summary: Issue certificate for completed course (Instructor/Admin only)
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *               - courseId
 *             properties:
 *               studentId:
 *                 type: string
 *               courseId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Certificate issued successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Certificate'
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request
 */
router.post('/issue-completed', verifyToken, authorizeRole('instructor', 'admin'), issueCertificateForCompletedCourse);

/**
 * @swagger
 * /api/certificates/{id}:
 *   delete:
 *     summary: Revoke certificate (Admin only)
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Certificate ID
 *     responses:
 *       200:
 *         description: Certificate revoked successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Certificate not found
 */
router.delete('/:id', verifyToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const certificate = await Certificate.findByIdAndDelete(id);
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    res.json({ message: 'Certificate revoked successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

/**
 * @swagger
 * /api/certificates/{id}:
 *   get:
 *     summary: Get certificate by ID (Student only)
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Certificate ID
 *     responses:
 *       200:
 *         description: Certificate details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Certificate'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Certificate not found
 */
router.get('/:id', verifyToken, authorizeRole('student'), getCertificateById);

module.exports = router;


