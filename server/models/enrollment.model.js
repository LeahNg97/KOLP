const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({// tạo schema cho enrollment
  studentId: { // yêu cầu đki học sẽ có j 
    type: mongoose.Schema.Types.ObjectId,// do lấy id từ collection/schema khác, lấy id object
    ref: 'User',// ref là tên của collection/schema khác, ở đây là User
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',// ref là tên của collection/schema khác, ở đây là Course
    required: true
  },
  progress: { type: Number, default: 0 },// tiến độ học tập của học viên, mặc định là 0
  completed: { type: Boolean, default: false },// đã hoàn thành khóa học hay chưa
  status: { type: String, enum: ['pending', 'approved'], default: 'pending' },// trạng thái đăng ký học, mặc định là pending
  completedQuizSets: [{ type: String }], // Array of completed (passed) quiz set IDs, lấi id của quiz set đã hoàn thành
  attemptedQuizSets: [{ type: String }], // Array of attempted quiz set IDs (regardless of pass/fail)
  instructorApproved: { type: Boolean, default: false }, // Instructor approval for course completion
  graduatedAt: { type: Date, default: null }
}, { timestamps: true });// tạo timestamps cho schema, sẽ tự động thêm createdAt và updatedAt cho mongo

module.exports = mongoose.models.Enrollment || mongoose.model('Enrollment', enrollmentSchema);