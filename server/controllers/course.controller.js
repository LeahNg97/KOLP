const Course = require('../models/course.model');
const NotificationService = require('../services/notification.service');

// GET all
exports.getAllCourses = async (req, res) => {
  const courses = await Course.find().populate('instructorId', 'name email role');
  res.json(courses);
};

// GET active courses only (for students)
// This endpoint filters courses to only show active courses that students can enroll in
exports.getActiveCourses = async (req, res) => {
  const courses = await Course.find({ status: 'active' }).populate('instructorId', 'name email role');
  res.json(courses);
};

// GET one
exports.getCourseById = async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate('instructorId', 'name email role');
  if (!course) return res.status(404).json({ message: 'Không tìm thấy khóa học' });
  res.json(course);
};

// POST
exports.createCourse = async (req, res) => {
  console.log('Create course request received:', req.body);
  console.log('User from token:', req.user);
  
  const { title, description, price, sections, imageIntroduction } = req.body;

  try {
    const newCourse = await Course.create({
      title,
      description,
      price: price || 0,
      sections: sections || [],
      imageIntroduction,
      instructorId: req.user.id
    });

    // Tạo thông báo cho admin
    try {
      await NotificationService.notifyCourseCreated(newCourse._id);
    } catch (error) {
      console.error('Error creating course notification:', error);
    }

    console.log('Course created successfully:', newCourse);
    res.status(201).json(newCourse);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ message: 'Error creating course: ' + error.message });
  }
};

// PUT
exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Không tìm thấy khóa học' });
    }

    // Check if user is the instructor of this course or an admin
    if (course.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bạn không có quyền cập nhật khóa học này' });
    }

    const updateData = req.body;
    // Only allow updating imageIntroduction if provided
    if (typeof updateData.imageIntroduction === 'undefined') {
      delete updateData.imageIntroduction;
    }
    
    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true }
    ).populate('instructorId', 'name email role');
    
    res.json(updatedCourse);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
};

// PATCH - Update course status (for instructors)
exports.updateCourseStatus = async (req, res) => {
  const { status } = req.body;
  const course = await Course.findByIdAndUpdate(
    req.params.id, 
    { status }, 
    { new: true }
  );
  if (!course) return res.status(404).json({ message: 'Không tìm thấy khóa học' });
  res.json(course);
};

// PATCH - Admin approve/reject course
exports.adminUpdateCourseStatus = async (req, res) => {
  const { status, adminNote } = req.body;
  
  // Only allow admin to change status to active or inactive
  if (!['active', 'inactive'].includes(status)) {
    return res.status(400).json({ message: 'Admin can only approve (active) or reject (inactive) courses' });
  }
  
  const course = await Course.findByIdAndUpdate(
    req.params.id, 
    { 
      status,
      adminNote: adminNote || null,
      reviewedAt: new Date(),
      reviewedBy: req.user.id
    }, 
    { new: true }
  );
  
  if (!course) return res.status(404).json({ message: 'Không tìm thấy khóa học' });
  
  // Tạo thông báo cho instructor
  try {
    const approved = status === 'active';
    await NotificationService.notifyCourseReview(course._id, approved, adminNote);
  } catch (error) {
    console.error('Error creating course review notification:', error);
  }
  
  res.json(course);
};

// GET courses by instructor
exports.getCoursesByInstructor = async (req, res) => {
  try {
    const courses = await Course.find({ instructorId: req.user.id })
      .populate('instructorId', 'name email role');
    
    // Get student count for each course
    const coursesWithStudentCount = await Promise.all(
      courses.map(async (course) => {
        const Enrollment = require('../models/enrollment.model');
        const studentCount = await Enrollment.countDocuments({ courseId: course._id });
        return {
          ...course.toObject(),
          studentCount
        };
      })
    );
    
    res.json(coursesWithStudentCount);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
};

// DELETE
exports.deleteCourse = async (req, res) => {
  const deleted = await Course.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Không tìm thấy khóa học' });
  res.json({ message: 'Đã xóa khóa học' });
};
