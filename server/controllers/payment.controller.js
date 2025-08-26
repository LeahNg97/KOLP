const Payment = require('../models/payment.model');
const Course = require('../models/course.model');
const Enrollment = require('../models/enrollment.model');

// Create a new payment
exports.createPayment = async (req, res) => {
  try {
    console.log('Full request body:', req.body);
    console.log('User from token:', req.user);
    
    const { courseId, paymentMethod, amount } = req.body;
    const studentId = req.user.id;

    console.log('User authentication check:', {
      userId: studentId,
      userRole: req.user.role,
      hasToken: !!req.user
    });

    // Log the request for debugging
    console.log('Payment request:', { courseId, paymentMethod, amount, studentId });

    // Validate required fields
    if (!courseId || !paymentMethod || amount === undefined || amount === null) {
      return res.status(400).json({ 
        message: 'Missing required fields: courseId, paymentMethod, and amount are required' 
      });
    }

    // Validate amount is a positive number
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount < 0) {
      return res.status(400).json({ 
        message: 'Amount must be a valid positive number' 
      });
    }
    
    // Update amount to ensure it's a number
    const finalAmount = numericAmount;

    // Validate course exists and is active
    if (!courseId || typeof courseId !== 'string') {
      console.log('Invalid courseId:', courseId);
      return res.status(400).json({ message: 'Invalid course ID' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      console.log('Course not found for ID:', courseId);
      return res.status(404).json({ message: 'Course not found' });
    }

    console.log('Found course:', {
      id: course._id,
      title: course.title,
      price: course.price,
      salePrice: course.salePrice,
      priceType: course.priceType,
      currency: course.currency,
      status: course.status
    });

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

    // Validate amount matches course price (consider sale price if available)
    const expectedAmount = course.salePrice || course.price;
    console.log('Amount validation:', {
      receivedAmount: amount,
      numericAmount: numericAmount,
      finalAmount: finalAmount,
      expectedAmount: expectedAmount,
      coursePrice: course.price,
      courseSalePrice: course.salePrice,
      matches: finalAmount === expectedAmount
    });
    
    if (finalAmount !== expectedAmount) {
      return res.status(400).json({ 
        message: `Payment amount (${finalAmount}) does not match expected amount (${expectedAmount})` 
      });
    }

    // Generate transaction ID
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create payment record
    const paymentData = {
      studentId,
      courseId,
      amount: finalAmount,
      currency: course.currency || 'AUD',
      paymentMethod,
      transactionId,
      paymentStatus: 'completed' // For demo purposes, assume payment is successful
    };
    
    console.log('Creating payment with data:', paymentData);
    
    const payment = await Payment.create(paymentData);

    // Create enrollment after successful payment
    const enrollmentData = {
      studentId,
      courseId,
      status: 'approved', // Auto-approve after payment
      enrollmentDate: new Date()
    };
    
    console.log('Creating enrollment with data:', enrollmentData);
    
    const enrollment = await Enrollment.create(enrollmentData);

    const response = {
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
    };
    
    console.log('Sending response:', response);
    res.status(201).json(response);

  } catch (error) {
    console.error('Payment creation error:', error);
    console.error('Error stack:', error.stack);
    
    // Handle specific error types
    if (error.name === 'ValidationError') {
      console.log('Validation error details:', error.errors);
      return res.status(400).json({ 
        message: 'Validation error: ' + Object.values(error.errors).map(e => e.message).join(', ')
      });
    }
    
    if (error.name === 'CastError') {
      console.log('Cast error details:', error);
      return res.status(400).json({ 
        message: 'Invalid ID format' 
      });
    }
    
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
