const express = require('express');// Import express for routing
const router = express.Router();
const { verifyToken, authorizeRole } = require('../middleware/auth.middleware');// Import middleware for verifying JWT tokens and authorizing roles
const { getMyCertificates, issueCertificate, issueCertificateForCompletedCourse, getCertificateById } = require('../controllers/certificate.controller');

// Define routes for certificate management
// These routes handle fetching a user's certificates, issuing new certificates, and retrieving a specific certificate by
router.get('/', verifyToken, authorizeRole('student'), getMyCertificates);
// Get all certificates for the authenticated student. lấy dữ liệu chứng chỉ của học sinh đã đăng ký
router.post('/issue', verifyToken, authorizeRole('instructor', 'admin'), issueCertificate);
// Issue a certificate for a student, post là gửi dữ liệu từ client lên server
router.post('/issue-completed', verifyToken, authorizeRole('instructor', 'admin'), issueCertificateForCompletedCourse);
// Issue a certificate for a completed course that doesn't have a certificate yet
router.get('/:id', verifyToken, authorizeRole('student'), getCertificateById);

module.exports = router;