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
    keywords: [{ type: String }], // từ khóa được tìm thấy trong câu trả lời
    similarity: { type: Number, default: 0 }, // độ tương đồng với đáp án đúng (0-1)
  }],
  
  // Trạng thái
  status: { 
    type: String, 
    enum: ['in_progress', 'completed', 'abandoned'], 
    default: 'in_progress' 
  },
  
  // Cài đặt chấm điểm
  gradingMethod: { 
    type: String, 
    enum: ['exact', 'keyword', 'similarity', 'manual'], 
    default: 'keyword' 
  },
  autoGraded: { type: Boolean, default: true }, // có được chấm tự động không
  manuallyGraded: { type: Boolean, default: false }, // có được chấm thủ công không
  
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
  if (this.totalQuestions === 0) return 0;
  this.percentage = Math.round((this.score / this.totalQuestions) * 100);
  return this.percentage;
};

// Method để kiểm tra có đạt không
ShortQuestionProgressSchema.methods.checkPassed = function(passingScore = 70) {
  this.passed = this.percentage >= passingScore;
  return this.passed;
};

// Method để tính điểm tương đồng (simple string similarity)
ShortQuestionProgressSchema.methods.calculateSimilarity = function(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  
  // Simple Jaccard similarity
  const words1 = new Set(s1.split(/\s+/));
  const words2 = new Set(s2.split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
};

// Method để chấm điểm tự động
ShortQuestionProgressSchema.methods.autoGrade = function() {
  this.answers.forEach((answer, index) => {
    const studentAnswer = answer.studentAnswer.toLowerCase().trim();
    const correctAnswer = answer.correctAnswer.toLowerCase().trim();
    
    // Exact match
    if (studentAnswer === correctAnswer) {
      answer.isCorrect = true;
      answer.points = answer.maxPoints;
      answer.similarity = 1;
    } else {
      // Calculate similarity
      answer.similarity = this.calculateSimilarity(studentAnswer, correctAnswer);
      
      // Partial credit based on similarity
      if (answer.similarity >= 0.8) {
        answer.isCorrect = true;
        answer.points = Math.round(answer.maxPoints * answer.similarity);
      } else if (answer.similarity >= 0.5) {
        answer.isCorrect = false;
        answer.points = Math.round(answer.maxPoints * answer.similarity * 0.5);
      } else {
        answer.isCorrect = false;
        answer.points = 0;
      }
    }
  });
  
  // Recalculate total score
  this.score = this.answers.reduce((sum, answer) => sum + answer.points, 0);
  this.calculatePercentage();
  
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
