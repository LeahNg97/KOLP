const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const QuizProgressSchema = new Schema({
  studentId: {
    type: Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: Types.ObjectId,
    ref: 'Course',
    required: true
  },
  quizId: {
    type: Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  // Quiz attempt details
  score: {
    type: Number,
    default: 0
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  correctAnswers: {
    type: Number,
    default: 0
  },
  percentage: {
    type: Number,
    default: 0
  },
  passed: {
    type: Boolean,
    default: false
  },
  // Time tracking
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  timeSpent: {
    type: Number, // seconds
    default: 0
  },
  // Attempt tracking
  attemptCount: {
    type: Number,
    default: 1
  },
  maxAttempts: {
    type: Number,
    default: 3
  },
  // Progress weight (40% of course progress)
  progressWeight: {
    type: Number,
    default: 40
  },
  // Detailed answers for review
  answers: [{
    questionIndex: Number,
    selectedOption: Number,
    isCorrect: Boolean,
    timeSpent: Number // seconds per question
  }],
  // Status
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'failed'],
    default: 'not_started'
  }
}, { timestamps: true });

// Compound index để đảm bảo mỗi học sinh chỉ có một record cho mỗi quiz trong mỗi course
QuizProgressSchema.index({ studentId: 1, courseId: 1, quizId: 1 }, { unique: true });

// Index để query nhanh theo course và student
QuizProgressSchema.index({ courseId: 1, studentId: 1 });

// Index để query theo quiz
QuizProgressSchema.index({ quizId: 1 });

// Virtual để tính toán progress percentage
QuizProgressSchema.virtual('progressPercentage').get(function() {
  if (this.passed) {
    return this.progressWeight; // 40% nếu pass
  }
  return 0; // 0% nếu fail hoặc chưa làm
});

// Method để cập nhật progress
QuizProgressSchema.methods.updateProgress = function(score, totalQuestions, answers, timeSpent) {
  this.score = score;
  this.totalQuestions = totalQuestions;
  this.correctAnswers = score;
  this.percentage = (score / totalQuestions) * 100;
  this.passed = this.percentage >= 70; // Assuming 70% is passing score
  this.completedAt = new Date();
  this.timeSpent = timeSpent;
  this.status = this.passed ? 'completed' : 'failed';
  this.answers = answers;
  
  return this.save();
};

// Method để reset progress (cho retake)
QuizProgressSchema.methods.resetProgress = function() {
  this.score = 0;
  this.correctAnswers = 0;
  this.percentage = 0;
  this.passed = false;
  this.completedAt = null;
  this.timeSpent = 0;
  this.status = 'not_started';
  this.answers = [];
  this.attemptCount += 1;
  
  return this.save();
};

// Pre-save middleware để tự động cập nhật percentage
QuizProgressSchema.pre('save', function(next) {
  if (this.score && this.totalQuestions) {
    this.percentage = (this.score / this.totalQuestions) * 100;
    this.passed = this.percentage >= 70;
  }
  next();
});

module.exports = mongoose.models.QuizProgress || mongoose.model('QuizProgress', QuizProgressSchema);
