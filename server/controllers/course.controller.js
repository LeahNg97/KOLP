const Course = require('../models/course.model'); // Import Course model


// GET all, 
exports.getAllCourses = async (req, res) => {//Lấy tất cả khóa học, 
  const courses = await Course.find().populate('instructorId', 'name email role');
  // tạo hằng courses chứa tất cả khóa học, lấy bằng câu lệnh await từ course model. tìm instructorID
    // và chỉ lấy các trường name, email, role của người hướng dẫn
    // populate sẽ thay thế ObjectId của instructorId bằng thông tin người hướng dẫn
  res.json(courses);// Trả về danh sách khóa học dưới dạng JSON
};

// GET active courses only (for students), chỉ lấy nhưng khóa học đang hoạt động (dành cho học viên)
// This endpoint filters courses to only show active courses that students can enroll in
// chi lấy những khoá active
exports.getActiveCourses = async (req, res) => {
  const courses = await Course.find({ status: 'active' }).populate('instructorId', 'name email role');
  res.json(courses);
};


// GET one, khi lấy 1 khoá học theo ID sẽ trả về thông tin chi tiết của khoá học đó
exports.getCourseById = async (req, res) => {
  const course = await Course.findById(req.params.id)// Tìm khoá học theo ID từ tham số URL
    .populate('instructorId', 'name email role');
  if (!course) return res.status(404).json({ message: 'cannot find course' });
  res.json(course);
};


// POST, tạo khoá học
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

    console.log('Course created successfully:', newCourse);
    res.status(201).json(newCourse);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ message: 'Error creating course: ' + error.message });
  }
};


// PUT, cập nhật khoá học 
exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Cannot find course' });
    }


    // Check if user is the instructor of this course or an admin
    if (course.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not allow to change the course' });
    }


    const updateData = req.body;// Lấy dữ liệu cập nhật từ body request
    // Only allow updating imageIntroduction if provided
    if (typeof updateData.imageIntroduction === 'undefined') {// Nếu không có trường imageIntroduction trong body request
      delete updateData.imageIntroduction;// Xoá trường này khỏi dữ liệu cập nhật
    }
   
    const updatedCourse = await Course.findByIdAndUpdate(// Tìm khoá học theo ID từ tham số URL, update khoá học với dữ liệu mới
      req.params.id,
      updateData,
      { new: true }
    ).populate('instructorId', 'name email role');
   
    res.json(updatedCourse);
  } catch (err) {
    res.status(500).json({ message: 'Server Error: ' + err.message });
  }
};


// PATCH - Update course status (for instructors)
exports.updateCourseStatus = async (req, res) => {
  const { status } = req.body;// chỉ lấy trường status từ body request
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
  const { status, adminNote } = req.body;// Lấy trường status và adminNote của admin từ body request
 
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
  res.json(course);
};


// GET courses by instructor
exports.getCoursesByInstructor = async (req, res) => {// Lấy tất cả khoá học của giảng viên
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
