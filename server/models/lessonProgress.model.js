const mongoose = require('mongoose');

const lessonProgressSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: true
  },
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  timeSpent: {
    type: Number, // seconds
    default: 0
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Compound index để đảm bảo mỗi học sinh chỉ có một record cho mỗi lesson
lessonProgressSchema.index({ studentId: 1, courseId: 1, lessonId: 1 }, { unique: true });

// Index để query nhanh theo course và student
lessonProgressSchema.index({ courseId: 1, studentId: 1 });

// Index để query theo module
lessonProgressSchema.index({ moduleId: 1, studentId: 1 });

module.exports = mongoose.models.LessonProgress || mongoose.model('LessonProgress', lessonProgressSchema);
