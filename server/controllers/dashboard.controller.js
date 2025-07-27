const User = require('../models/user.model');
const Course = require('../models/course.model');
const Enrollment = require('../models/enrollment.model');

exports.getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalEnrollments = await Enrollment.countDocuments();

    res.json({ totalUsers, totalCourses, totalEnrollments });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
};

exports.getInstructorStats = async (req, res) => {
  try {
    const myCourses = await Course.find({ instructorId: req.user.id });
    const courseIds = myCourses.map(c => c._id);
    const totalStudents = await Enrollment.countDocuments({ courseId: { $in: courseIds } });

    res.json({
      totalCourses: myCourses.length,
      totalStudents
    });
  } catch (err) {
    res.status(500).json({ message: 'Server Error: ' + err.message });
  }
};

exports.getStudentStats = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ studentId: req.user.id });

    const totalCourses = enrollments.length;
    const completed = enrollments.filter(e => e.completed).length;

    res.json({
      totalCourses,
      completed
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
};