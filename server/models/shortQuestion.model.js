const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const ShortQuestionSchema = new Schema({
  courseId: { type: Types.ObjectId, ref: 'Course', required: true, index: true },
  moduleId: { type: Types.ObjectId, ref: 'Module' }, // optional nếu gắn theo module
  lessonId: { type: Types.ObjectId, ref: 'Lesson' }, // optional nếu gắn theo lesson
  
  title: { type: String, required: true },
  description: { type: String },
  instructions: { type: String }, // hướng dẫn làm bài
  
  passingScore: { type: Number, default: 70 }, // điểm đạt (phần trăm)
  timeLimit: { type: Number }, // thời gian làm bài (phút), null = không giới hạn
  
  isPublished: { type: Boolean, default: true },
  isRandomized: { type: Boolean, default: false }, // có random thứ tự câu hỏi không
  
  questions: [{
    question: { type: String, required: true },
    correctAnswer: { type: String, required: true }, // đáp án đúng
    explanation: { type: String }, // giải thích đáp án
    points: { type: Number, default: 1 }, // điểm cho câu hỏi
    maxLength: { type: Number, default: 500 }, // độ dài tối đa của câu trả lời
    minLength: { type: Number, default: 10 }, // độ dài tối thiểu của câu trả lời
  }],
  
  // Quiz settings
  allowRetake: { type: Boolean, default: true }, // cho phép làm lại
  showResults: { type: Boolean, default: true }, // hiển thị kết quả sau khi làm
  showCorrectAnswers: { type: Boolean, default: false }, // hiển thị đáp án đúng
  
  // Stats
  attemptCount: { type: Number, default: 0 }, // số lần làm bài
  averageScore: { type: Number, default: 0 }, // điểm trung bình
  
}, { timestamps: true });

// Indexes
ShortQuestionSchema.index({ courseId: 1, isPublished: 1 });
ShortQuestionSchema.index({ moduleId: 1, isPublished: 1 });
ShortQuestionSchema.index({ lessonId: 1, isPublished: 1 });

// --- Helper: recalc short question stats cho 1 course ---
const recalcShortQuestionStats = async (courseId) => {
  try {
    const [agg] = await mongoose.model('ShortQuestion').aggregate([
      { $match: { courseId: new Types.ObjectId(courseId), isPublished: true } },
      { $project: { qCount: { $size: '$questions' } } },
      { $group: { 
        _id: null, 
        shortQuestionCount: { $sum: 1 }, 
        totalQuestions: { $sum: '$qCount' } 
      }}
    ]);
    
    const shortQuestionCount = agg?.shortQuestionCount || 0;
    const totalQuestions = agg?.totalQuestions || 0;
    
    await mongoose.model('Course').updateOne(
      { _id: courseId },
      { 
        $set: { 
          'stats.shortQuestionCount': shortQuestionCount, 
          'stats.totalShortQuestions': totalQuestions, 
          'flags.hasShortQuestion': shortQuestionCount > 0,
          'flags.shortQuestionRequired': shortQuestionCount > 0
        } 
      }
    );
    
    console.log(`✅ Updated short question stats for course ${courseId}: ${shortQuestionCount} short question sets, ${totalQuestions} questions`);
  } catch (error) {
    console.error(`❌ Error recalculating short question stats for course ${courseId}:`, error);
  }
};

// Tự động đồng bộ sau khi save (tạo / sửa / publish toggle)
ShortQuestionSchema.post('save', async function(doc, next) {
  try { 
    if (doc && doc.courseId) {
      await recalcShortQuestionStats(doc.courseId); 
    }
    next(); 
  } catch (e) { 
    console.error('Error in post-save hook:', e);
    next(); // Continue even if stats update fails
  }
});

// Và khi xoá
ShortQuestionSchema.post('findOneAndDelete', async function(doc, next) {
  try { 
    if (doc && doc.courseId) {
      await recalcShortQuestionStats(doc.courseId); 
    }
    next(); 
  } catch (e) { 
    console.error('Error in post-delete hook:', e);
    next(); // Continue even if stats update fails
  }
});

// Khi update (đặc biệt là isPublished)
ShortQuestionSchema.post('findOneAndUpdate', async function(doc, next) {
  try {
    if (doc && doc.courseId) {
      await recalcShortQuestionStats(doc.courseId);
    }
    next();
  } catch (e) {
    console.error('Error in post-update hook:', e);
    next(); // Continue even if stats update fails
  }
});

// Khi delete nhiều
ShortQuestionSchema.post('deleteMany', async function(result, next) {
  try {
    if (result.deletedCount > 0) {
      // Lấy danh sách courseId bị ảnh hưởng
      const affectedCourseIds = await mongoose.model('ShortQuestion').distinct('courseId', {
        _id: { $in: result.deletedIds || [] }
      });
      
      // Recalc cho từng course
      for (const courseId of affectedCourseIds) {
        await recalcShortQuestionStats(courseId);
      }
    }
    next();
  } catch (e) {
    console.error('Error in post-deleteMany hook:', e);
    next(); // Continue even if stats update fails
  }
});

module.exports = mongoose.models.ShortQuestion || mongoose.model('ShortQuestion', ShortQuestionSchema);
