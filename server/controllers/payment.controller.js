const Payment = require('../models/payment.model');
const Course = require('../models/course.model');
const Enrollment = require('../models/enrollment.model');


// Create a new payment
exports.createPayment = async (req, res) => {
  try {
    const { courseId, paymentMethod, amount } = req.body;
    const studentId = req.user.id;


    // Validate course exists and is active
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }


    if (course.status !== 'active') {
      return res.status(400).json({ message: 'Course is not available for enrollment' });
    }


    // Check if student is already enrolled
    const existingEnrollment = await Enrollment.findOne({
      studentId,
      courseId
    });


    if (existingEnrollment) {
      return res.status(400).json({ message: 'You are already enrolled in this course' });
    }


    // Validate amount matches course price
    if (amount !== course.price) {
      return res.status(400).json({ message: 'Payment amount does not match course price' });
    }


    // Generate transaction ID
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;


    // Create payment record
    const payment = await Payment.create({
      studentId,
      courseId,
      amount,
      paymentMethod,
      transactionId,
      paymentStatus: 'completed' // For demo purposes, assume payment is successful
    });


    // Create enrollment after successful payment
    const enrollment = await Enrollment.create({
      studentId,
      courseId,
      status: 'approved', // Auto-approve after payment
      enrollmentDate: new Date()
    });


    res.status(201).json({
      message: 'Payment successful and enrollment completed',
      payment: {
        id: payment._id,
        transactionId: payment.transactionId,
        amount: payment.amount,
        status: payment.paymentStatus,
        date: payment.paymentDate
      },
      enrollment: {
        id: enrollment._id,
        status: enrollment.status,
        date: enrollment.enrollmentDate
      }
    });


  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({ message: 'Error processing payment: ' + error.message });
  }
};


// Get payment history for a student
exports.getStudentPayments = async (req, res) => {
  try {
    const studentId = req.user.id;
   
    const payments = await Payment.find({ studentId })
      .populate('courseId', 'title imageIntroduction')
      .sort({ paymentDate: -1 });


    res.json(payments);
  } catch (error) {
    console.error('Error fetching student payments:', error);
    res.status(500).json({ message: 'Error fetching payment history' });
  }
};


// Get payment by ID
exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('studentId', 'name email')
      .populate('courseId', 'title price');


    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }


    // Check if user is authorized to view this payment
    if (payment.studentId._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this payment' });
    }


    res.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ message: 'Error fetching payment details' });
  }
};


// Admin: Get all payments
exports.getAllPayments = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }


    const payments = await Payment.find()
      .populate('studentId', 'name email')
      .populate('courseId', 'title price')
      .sort({ paymentDate: -1 });


    res.json(payments);
  } catch (error) {
    console.error('Error fetching all payments:', error);
    res.status(500).json({ message: 'Error fetching payments' });
  }
};


// Process refund (admin only)
exports.processRefund = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }


    const { paymentId } = req.params;
    const { notes } = req.body;


    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }


    if (payment.paymentStatus !== 'completed') {
      return res.status(400).json({ message: 'Only completed payments can be refunded' });
    }


    payment.paymentStatus = 'refunded';
    payment.notes = notes || 'Refund processed by admin';
    await payment.save();


    res.json({ message: 'Refund processed successfully', payment });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ message: 'Error processing refund' });
  }
};



