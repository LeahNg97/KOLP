const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
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
  progress: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'approved', 'cancelled'], default: 'pending' },
  approvedAt: { type: Date }, // When enrollment was approved
  cancelledAt: { type: Date }, // When enrollment was cancelled
  completedQuizSets: [{ type: String }], // Array of completed (passed) quiz set IDs
  attemptedQuizSets: [{ type: String }], // Array of attempted quiz set IDs (regardless of pass/fail)
  instructorApproved: { type: Boolean, default: false }, // Instructor approval for course completion
  graduatedAt: { type: Date, default: null }
}, { timestamps: true });

enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });
enrollmentSchema.index({ courseId: 1, status: 1 });

// Post middleware để tự động cập nhật course stats
enrollmentSchema.post('save', async function(doc) {
  try {
    const Course = require('./course.model');
    
    if (doc.status === 'approved') {
      // Tăng student count khi enrollment được approved
      await Course.updateOne(
        { _id: doc.courseId },
        { $inc: { 'stats.studentCount': 1 } }
      );
      console.log(`Increased student count for course ${doc.courseId}`);
    }
  } catch (error) {
    console.error('Error updating course stats after enrollment save:', error);
  }
});

enrollmentSchema.post('findOneAndUpdate', async function(doc) {
  try {
    const Course = require('./course.model');
    
    if (doc && doc.status === 'approved') {
      // Tăng student count khi enrollment được approved
      await Course.updateOne(
        { _id: doc.courseId },
        { $inc: { 'stats.studentCount': 1 } }
      );
      console.log(`Increased student count for course ${doc.courseId} after update`);
    }
  } catch (error) {
    console.error('Error updating course stats after enrollment update:', error);
  }
});

enrollmentSchema.post('findOneAndDelete', async function(doc) {
  try {
    const Course = require('./course.model');
    
    if (doc && doc.status === 'approved') {
      // Giảm student count khi enrollment approved bị xóa
      await Course.updateOne(
        { _id: doc.courseId },
        { $inc: { 'stats.studentCount': -1 } }
      );
      console.log(`Decreased student count for course ${doc.courseId} after deletion`);
    }
  } catch (error) {
    console.error('Error updating course stats after enrollment deletion:', error);
  }
});

module.exports = mongoose.models.Enrollment || mongoose.model('Enrollment', enrollmentSchema);
