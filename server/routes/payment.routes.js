const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { verifyToken } = require('../middleware/auth.middleware');


// Apply auth middleware to all routes
router.use(verifyToken);


// Create payment and enroll in course
router.post('/create', paymentController.createPayment);


// Get student's payment history
router.get('/student', paymentController.getStudentPayments);


// Get specific payment by ID
router.get('/:id', paymentController.getPaymentById);


// Admin routes
router.get('/admin/all', paymentController.getAllPayments);
router.put('/admin/:id/refund', paymentController.processRefund);


module.exports = router;





