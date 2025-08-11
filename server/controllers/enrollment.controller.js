const Enrollment = require('../models/enrollment.model');

// Sinh viên đăng ký khóa học
exports.enrollCourse = async (req, res) => {
  const { courseId } = req.body;

  const exists = await Enrollment.findOne({
    studentId: req.user.id,
    courseId
  });

  if (exists) return res.status(400).json({ message: 'Đã đăng ký khóa học này' });

  const enrollment = await Enrollment.create({
    studentId: req.user.id,
    courseId,
    status: 'pending'
  });

  res.status(201).json(enrollment);
};

// Duyệt đăng ký khóa học (instructor/admin)
exports.approveEnrollment = async (req, res) => {
  const { enrollmentId } = req.params;
  const enrollment = await Enrollment.findByIdAndUpdate(
    enrollmentId,
    { status: 'approved' },
    { new: true }
  );
  if (!enrollment) return res.status(404).json({ message: 'Không tìm thấy đăng ký' });
  res.json(enrollment);
};

// Lấy danh sách khóa học sinh viên đã đăng ký
exports.getMyEnrollments = async (req, res) => {
  const enrollments = await Enrollment.find({ studentId: req.user.id }).populate('courseId');
  res.json(enrollments);
};

// Instructor/Admin xem danh sách sinh viên của 1 khóa học
exports.getStudentsByCourse = async (req, res) => {
  const { courseId } = req.params;

  const enrollments = await Enrollment.find({ courseId }).populate('studentId', 'name email');
  res.json(enrollments);
};

// Instructor xem tất cả sinh viên đăng ký khóa học của mình
exports.getInstructorStudents = async (req, res) => {
  try {
    const Course = require('../models/course.model');
    
    // Get all courses by this instructor
    const instructorCourses = await Course.find({ instructorId: req.user.id });
    const courseIds = instructorCourses.map(course => course._id);
    
    // Get all enrollments for these courses
    const enrollments = await Enrollment.find({ 
      courseId: { $in: courseIds } 
    }).populate('studentId', 'name email').populate('courseId', 'title');
    
    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
};

// Hủy đăng ký khóa học (student)
exports.cancelEnrollment = async (req, res) => {
  const { enrollmentId } = req.params;
  const enrollment = await Enrollment.findById(enrollmentId);
  if (!enrollment) return res.status(404).json({ message: 'Không tìm thấy đăng ký' });
  if (enrollment.studentId.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Bạn không có quyền hủy đăng ký này' });
  }
  await Enrollment.findByIdAndDelete(enrollmentId);
  res.json({ message: 'Đã hủy đăng ký khóa học' });
};

// Instructor/Admin từ chối đăng ký khóa học
exports.rejectEnrollment = async (req, res) => {
  const { enrollmentId } = req.params;
  const enrollment = await Enrollment.findById(enrollmentId);
  if (!enrollment) return res.status(404).json({ message: 'Không tìm thấy đăng ký' });
  
  await Enrollment.findByIdAndDelete(enrollmentId);
  res.json({ message: 'Đã từ chối đăng ký khóa học' });
};