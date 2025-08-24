const mongoose = require('mongoose');
const Enrollment = require('../models/enrollment.model');
const Course = require('../models/course.model');
const NotificationService = require('../services/notification.service');

// Approve (admin duyệt) — chỉ +1 nếu trước đó chưa approved
exports.adminApproveEnrollment = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const { id } = req.params; // enrollmentId
      const enrollment = await Enrollment.findOneAndUpdate(
        { _id: id, status: { $ne: 'approved' } }, // guard idempotent
        { $set: { status: 'approved', approvedAt: new Date() } },
        { new: true, session }
      );
      if (!enrollment) {
        return res.status(400).json({ message: 'Already approved or not found' });
      }
      await Course.updateOne(
        { _id: enrollment.courseId },
        { $inc: { 'stats.studentCount': 1 } },
        { session }
      );
      res.json({ ok: true, enrollment });
    });
  } catch (e) {
    next(e);
  } finally {
    session.endSession();
  }
};

// Enroll (student tự đăng ký) — tất cả đều cần instructor duyệt
exports.enrollCourse = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const { courseId } = req.body;
      const studentId = req.user.id;

      // tránh trùng
      const exists = await Enrollment.findOne({ courseId, studentId }).session(session);
      if (exists) return res.status(409).json({ message: 'Already enrolled' });

      const course = await Course.findById(courseId).session(session);
      if (!course) return res.status(404).json({ message: 'Course not found' });

      // Tất cả enrollments đều cần instructor duyệt
      const enrollment = await Enrollment.create([{
        studentId,
        courseId,
        status: 'pending', // Luôn là pending, cần instructor duyệt
        approvedAt: undefined,
      }], { session }).then(r => r[0]);

      // Gửi thông báo cho instructor
      try {
        await NotificationService.notifyInstructorEnrollment(course.instructorId, studentId, courseId);
      } catch (err) {
        console.error('Error sending enrollment notification:', err);
      }

      res.status(201).json({
        ...enrollment.toObject(),
        message: 'Enrollment submitted successfully. Please wait for instructor approval.'
      });
    });
  } catch (e) {
    next(e);
  } finally {
    session.endSession();
  }
};

// Cancel enrollment — nếu đang approved thì -1
exports.cancelEnrollment = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const { enrollmentId } = req.params; // Sử dụng enrollmentId từ params
      const studentId = req.user.id;

      const enrollment = await Enrollment.findById(enrollmentId).session(session);
      if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });
      
      // Kiểm tra xem student có quyền cancel enrollment này không
      if (enrollment.studentId.toString() !== studentId) {
        return res.status(403).json({ message: 'You can only cancel your own enrollment' });
      }

      const wasApproved = enrollment.status === 'approved';

      enrollment.status = 'cancelled';
      enrollment.cancelledAt = new Date();
      await enrollment.save({ session });

      if (wasApproved) {
        await Course.updateOne(
          { _id: enrollment.courseId },
          { $inc: { 'stats.studentCount': -1 } },
          { session }
        );
        console.log(`Decreased student count for course ${enrollment.courseId}`);
      }
      
      res.json({ 
        ok: true, 
        message: 'Enrollment cancelled successfully',
        wasApproved 
      });
    });
  } catch (e) {
    next(e);
  } finally {
    session.endSession();
  }
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

// Instructor/Admin duyệt đăng ký khóa học
exports.approveEnrollment = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const { enrollmentId } = req.params;
      const enrollment = await Enrollment.findById(enrollmentId).session(session);
      if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });
      
      if (enrollment.status === 'approved') {
        return res.status(400).json({ message: 'Enrollment already approved' });
      }
      
      enrollment.status = 'approved';
      enrollment.approvedAt = new Date();
      await enrollment.save({ session });
      
      // Increment student count
      await Course.updateOne(
        { _id: enrollment.courseId },
        { $inc: { 'stats.studentCount': 1 } },
        { session }
      );
      
      res.json({ message: 'Enrollment approved successfully', enrollment });
    });
  } catch (e) {
    next(e);
  } finally {
    session.endSession();
  }
};

// Instructor/Admin từ chối đăng ký khóa học
exports.rejectEnrollment = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const { enrollmentId } = req.params;
      const enrollment = await Enrollment.findById(enrollmentId).session(session);
      if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });
      
      const wasApproved = enrollment.status === 'approved';
      
      await Enrollment.findByIdAndDelete(enrollmentId, { session });
      
      // Nếu đang approved thì -1 studentCount
      if (wasApproved) {
        await Course.updateOne(
          { _id: enrollment.courseId },
          { $inc: { 'stats.studentCount': -1 } },
          { session }
        );
      }
      
      res.json({ message: 'Enrollment rejected successfully' });
    });
  } catch (e) {
    next(e);
  } finally {
    session.endSession();
  }
};

// Admin/Instructor xóa enrollment (force delete)
exports.deleteEnrollment = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const { enrollmentId } = req.params;
      
      const enrollment = await Enrollment.findById(enrollmentId).session(session);
      if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });
      
      // Kiểm tra quyền: chỉ admin hoặc instructor của khóa học mới được xóa
      const course = await Course.findById(enrollment.courseId).session(session);
      if (!course) return res.status(404).json({ message: 'Course not found' });
      
      const isAdmin = req.user.role === 'admin';
      const isInstructor = course.instructorId.toString() === req.user.id;
      
      if (!isAdmin && !isInstructor) {
        return res.status(403).json({ message: 'You are not authorized to delete this enrollment' });
      }

      const wasApproved = enrollment.status === 'approved';

      // Xóa enrollment
      await Enrollment.findByIdAndDelete(enrollmentId, { session });

      // Nếu đang approved thì -1 studentCount
      if (wasApproved) {
        await Course.updateOne(
          { _id: enrollment.courseId },
          { $inc: { 'stats.studentCount': -1 } },
          { session }
        );
        console.log(`Decreased student count for course ${enrollment.courseId} after deletion`);
      }
      
      res.json({ 
        message: 'Enrollment deleted successfully',
        wasApproved 
      });
    });
  } catch (e) {
    next(e);
  } finally {
    session.endSession();
  }
};

// Instructor approve course completion based on lesson progress
exports.approveCourseCompletion = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const { courseId, studentId } = req.params;
      
      // Find the enrollment
      const enrollment = await Enrollment.findOne({
        courseId,
        studentId,
        status: 'approved'
      }).session(session);
      
      if (!enrollment) {
        return res.status(404).json({ 
          message: 'Enrollment not found or not approved' 
        });
      }
      
      // Check if user is instructor of this course
      const course = await Course.findById(courseId).session(session);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
      
      const isAdmin = req.user.role === 'admin';
      const isInstructor = course.instructorId.toString() === req.user.id;
      
      if (!isAdmin && !isInstructor) {
        return res.status(403).json({ 
          message: 'You are not authorized to approve course completion for this course' 
        });
      }
      
      // Check if student has completed all lessons (100% progress)
      if (enrollment.progress < 100) {
        return res.status(400).json({ 
          message: 'Student has not completed all lessons yet. Progress must be 100% to approve completion.' 
        });
      }
      
      // Mark as instructor approved
      enrollment.instructorApproved = true;
      enrollment.completed = true;
      enrollment.graduatedAt = new Date();
      await enrollment.save({ session });
      
      // Send notification to student about course completion approval
      try {
        await NotificationService.notifyStudentCourseCompletionApproved(
          enrollment.studentId, 
          courseId, 
          course.title
        );
      } catch (err) {
        console.error('Error sending completion approval notification:', err);
      }
      
      res.json({ 
        message: 'Course completion approved successfully', 
        enrollment 
      });
    });
  } catch (e) {
    next(e);
  } finally {
    session.endSession();
  }
};
