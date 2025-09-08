const User = require('../models/user.model');
const Course = require('../models/course.model');
const Enrollment = require('../models/enrollment.model');
const Certificate = require('../models/certificate.model');

exports.getAdminStats = async (req, res) => {
  try {
    // Basic counts
    const totalUsers = await User.countDocuments();
    const totalInstructors = await User.countDocuments({ role: 'instructor' });
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalCourses = await Course.countDocuments();
    const totalCertificates = await Certificate.countDocuments();
    const totalEnrollments = await Enrollment.countDocuments();

    // Time-based statistics
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    // Weekly stats
    const weeklyUsers = await User.countDocuments({ createdAt: { $gte: weekAgo } });
    const weeklyInstructors = await User.countDocuments({ 
      role: 'instructor', 
      createdAt: { $gte: weekAgo } 
    });
    const weeklyStudents = await User.countDocuments({ 
      role: 'student', 
      createdAt: { $gte: weekAgo } 
    });
    const weeklyCourses = await Course.countDocuments({ createdAt: { $gte: weekAgo } });
    const weeklyCertificates = await Certificate.countDocuments({ issuedAt: { $gte: weekAgo } });

    // Monthly stats
    const monthlyUsers = await User.countDocuments({ createdAt: { $gte: monthAgo } });
    const monthlyInstructors = await User.countDocuments({ 
      role: 'instructor', 
      createdAt: { $gte: monthAgo } 
    });
    const monthlyStudents = await User.countDocuments({ 
      role: 'student', 
      createdAt: { $gte: monthAgo } 
    });
    const monthlyCourses = await Course.countDocuments({ createdAt: { $gte: monthAgo } });
    const monthlyCertificates = await Certificate.countDocuments({ issuedAt: { $gte: monthAgo } });

    // Yearly stats
    const yearlyUsers = await User.countDocuments({ createdAt: { $gte: yearAgo } });
    const yearlyInstructors = await User.countDocuments({ 
      role: 'instructor', 
      createdAt: { $gte: yearAgo } 
    });
    const yearlyStudents = await User.countDocuments({ 
      role: 'student', 
      createdAt: { $gte: yearAgo } 
    });
    const yearlyCourses = await Course.countDocuments({ createdAt: { $gte: yearAgo } });
    const yearlyCertificates = await Certificate.countDocuments({ issuedAt: { $gte: yearAgo } });

    res.json({
      totalUsers,
      totalInstructors,
      totalStudents,
      totalCourses,
      totalCertificates,
      totalEnrollments,
      weekly: {
        users: weeklyUsers,
        instructors: weeklyInstructors,
        students: weeklyStudents,
        courses: weeklyCourses,
        certificates: weeklyCertificates
      },
      monthly: {
        users: monthlyUsers,
        instructors: monthlyInstructors,
        students: monthlyStudents,
        courses: monthlyCourses,
        certificates: monthlyCertificates
      },
      yearly: {
        users: yearlyUsers,
        instructors: yearlyInstructors,
        students: yearlyStudents,
        courses: yearlyCourses,
        certificates: yearlyCertificates
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
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
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// Get detailed instructor analytics
exports.getInstructorAnalytics = async (req, res) => {
  try {
    const instructorId = req.user.id;
    
    // Get instructor's courses
    const myCourses = await Course.find({ instructorId });
    const courseIds = myCourses.map(c => c._id);
    
    // Basic course stats
    const totalCourses = myCourses.length;
    const totalStudents = await Enrollment.countDocuments({ courseId: { $in: courseIds } });
    const totalEnrollments = await Enrollment.countDocuments({ courseId: { $in: courseIds } });
    const completedCourses = await Enrollment.countDocuments({ 
      courseId: { $in: courseIds }, 
      completed: true 
    });

    // Quiz analytics
    const Quiz = require('../models/quiz.model');
    const QuizProgress = require('../models/quizProgress.model');
    
    let totalQuizzes = 0;
    let totalSubmissions = 0;
    let totalScore = 0;
    let submissionCount = 0;
    let passCount = 0;

    // Get quiz data for each course
    for (const course of myCourses) {
      const quizzes = await Quiz.find({ courseId: course._id });
      totalQuizzes += quizzes.length;

      for (const quiz of quizzes) {
        const quizProgresses = await QuizProgress.find({ 
          quizId: quiz._id,
          status: 'completed'
        });
        
        totalSubmissions += quizProgresses.length;
        
        for (const progress of quizProgresses) {
          if (progress.score !== undefined) {
            totalScore += progress.score;
            submissionCount++;
            
            const numQuestions = quiz.questions?.length || 1;
            const percent = (progress.score / numQuestions) * 100;
            if (percent >= 60) passCount++;
          }
        }
      }
    }

    const averageScore = submissionCount > 0 ? (totalScore / submissionCount).toFixed(1) : 0;
    const passRate = submissionCount > 0 ? `${Math.round((passCount / submissionCount) * 100)}%` : '0%';

    res.json({
      success: true,
      data: {
        totalCourses,
        totalStudents,
        totalEnrollments,
        completedCourses,
        totalQuizzes,
        totalSubmissions,
        averageScore: parseFloat(averageScore),
        passRate
      }
    });
  } catch (err) {
    console.error('Instructor analytics error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error: ' + err.message 
    });
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
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};
