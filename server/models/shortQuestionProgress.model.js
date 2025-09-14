const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const ShortQuestionProgressSchema = new Schema({
  studentId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
  courseId: { type: Types.ObjectId, ref: 'Course', required: true, index: true },
  shortQuestionId: { type: Types.ObjectId, ref: 'ShortQuestion', required: true, index: true },
  
  attemptId: { type: String, required: true, unique: true }, // unique identifier cho mỗi lần làm bài
  attemptNumber: { type: Number, default: 1 }, // số lần thử
  
  // Kết quả tổng thể
  score: { type: Number, default: 0 }, // điểm đạt được
  totalQuestions: { type: Number, required: true }, // tổng số câu hỏi
  percentage: { type: Number, default: 0 }, // phần trăm điểm
  passed: { type: Boolean, default: false }, // có đạt không
  
  // Thời gian
  timeSpent: { type: Number, default: 0 }, // thời gian làm bài (giây)
  startedAt: { type: Date, default: Date.now },
  submittedAt: { type: Date },
  
  // Chi tiết câu trả lời
  answers: [{
    questionIndex: { type: Number, required: true },
    studentAnswer: { type: String, default: '' }, // câu trả lời của học viên
    correctAnswer: { type: String, required: true }, // đáp án đúng
    isCorrect: { type: Boolean, default: false }, // có đúng không
    points: { type: Number, default: 0 }, // điểm đạt được cho câu này
    maxPoints: { type: Number, required: true }, // điểm tối đa cho câu này
    timeSpent: { type: Number, default: 0 }, // thời gian làm câu này (giây)
    feedback: { type: String }, // phản hồi cho câu trả lời
  }],
  
  // Trạng thái
  status: { 
    type: String, 
    enum: ['in_progress', 'submitted', 'graded', 'completed', 'abandoned'], 
    default: 'in_progress' 
  },
  
  // Cài đặt chấm điểm
  manuallyGraded: { type: Boolean, default: false }, // có được chấm thủ công không
  requiresManualGrading: { type: Boolean, default: true }, // yêu cầu chấm thủ công
  
  // Thông tin chấm điểm
  gradedBy: { type: Types.ObjectId, ref: 'User' }, // người chấm điểm
  gradedAt: { type: Date }, // thời điểm chấm điểm
  
  // Feedback tổng thể
  overallFeedback: { type: String },
  instructorNotes: { type: String }, // ghi chú của giảng viên
  
}, { timestamps: true });

// Indexes
ShortQuestionProgressSchema.index({ studentId: 1, courseId: 1 });
ShortQuestionProgressSchema.index({ shortQuestionId: 1, studentId: 1 });
ShortQuestionProgressSchema.index({ attemptId: 1 });
ShortQuestionProgressSchema.index({ status: 1, submittedAt: 1 });

// Virtual để tính toán thống kê
ShortQuestionProgressSchema.virtual('completionTime').get(function() {
  if (this.submittedAt && this.startedAt) {
    return Math.floor((this.submittedAt - this.startedAt) / 1000);
  }
  return this.timeSpent;
});

// Method để tính điểm phần trăm
ShortQuestionProgressSchema.methods.calculatePercentage = function() {
  const totalMaxPoints = this.answers.reduce((sum, answer) => sum + answer.maxPoints, 0);
  if (totalMaxPoints === 0) return 0;
  this.percentage = Math.round((this.score / totalMaxPoints) * 100);
  return this.percentage;
};

// Method để kiểm tra có đạt không
ShortQuestionProgressSchema.methods.checkPassed = function(passingScore = 70) {
  this.passed = this.percentage >= passingScore;
  return this.passed;
};



// Method để chấm điểm thủ công
ShortQuestionProgressSchema.methods.manualGrade = function(gradedAnswers, instructorId) {
  // Cập nhật điểm cho từng câu trả lời
  gradedAnswers.forEach((gradedAnswer) => {
    const answer = this.answers.find(a => a.questionIndex === gradedAnswer.questionIndex);
    if (answer) {
      answer.points = gradedAnswer.points;
      answer.isCorrect = gradedAnswer.isCorrect;
      answer.feedback = gradedAnswer.feedback || '';
    }
  });
  
  // Recalculate total score
  this.score = this.answers.reduce((sum, answer) => sum + answer.points, 0);
  this.calculatePercentage();
  
  // Cập nhật trạng thái
  this.status = 'graded';
  this.manuallyGraded = true;
  this.gradedBy = instructorId;
  this.gradedAt = new Date();
  
  return this;
};

// Method để hoàn thành chấm điểm
ShortQuestionProgressSchema.methods.completeGrading = function(passingScore = 70) {
  this.status = 'completed';
  this.checkPassed(passingScore);
  return this;
};

// Pre-save middleware
ShortQuestionProgressSchema.pre('save', function(next) {
  if (this.isModified('answers') || this.isModified('score')) {
    this.calculatePercentage();
  }
  next();
});

module.exports = mongoose.models.ShortQuestionProgress || mongoose.model('ShortQuestionProgress', ShortQuestionProgressSchema);
