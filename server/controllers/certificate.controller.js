const Certificate = require('../models/certificate.model');


exports.getMyCertificates = async (req, res) => {
  const certs = await Certificate.find({ studentId: req.user.id }).populate('courseId', 'title');
  res.json(certs);
};

// Issue certificate for a student, only for completed courses
exports.issueCertificate = async (req, res) => {
  const { courseId, studentId } = req.body;


  const exists = await Certificate.findOne({ studentId, courseId });
  if (exists) return res.status(400).json({ message: 'Đã cấp chứng chỉ' });


  const cert = await Certificate.create({ studentId, courseId });
  res.status(201).json(cert);
};

// Issue certificate for completed courses that don't have certificates yet
exports.issueCertificateForCompletedCourse = async (req, res) => {
  const { courseId, studentId } = req.body;

  try {
    // Check if student has completed the course
    const Enrollment = require('../models/enrollment.model');
    const enrollment = await Enrollment.findOne({ courseId, studentId });
    
    if (!enrollment) {
      return res.status(404).json({ message: 'Student not enrolled in this course' });
    }

    if (!enrollment.instructorApproved) {
      return res.status(400).json({ message: 'Course not yet approved by instructor' });
    }

    // Check if certificate already exists
    const exists = await Certificate.findOne({ studentId, courseId });
    if (exists) return res.status(400).json({ message: 'Certificate already exists' });

    // Issue the certificate
    const cert = await Certificate.create({ studentId, courseId });
    res.status(201).json(cert);
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

exports.getCertificateById = async (req, res) => {
  const { id } = req.params;
  try {
    const cert = await Certificate.findById(id)
      .populate('studentId', 'name email')
      .populate('courseId', 'title');
    if (!cert) return res.status(404).json({ message: 'Certificate not found' });
    res.json(cert);
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

