const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const QuestionSchema = new Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctIndex: { type: Number, required: true },
  explanation: { type: String }, // giải thích đáp án
  points: { type: Number, default: 1 }, // điểm cho câu hỏi
});

const QuizSchema = new Schema({
  courseId: { type: Types.ObjectId, ref: 'Course', required: true, index: true },
  moduleId: { type: Types.ObjectId, ref: 'Module' }, // optional nếu gắn theo module
  lessonId: { type: Types.ObjectId, ref: 'Lesson' }, // optional nếu gắn theo lesson
  
  title: { type: String, required: true },
  description: { type: String },
  instructions: { type: String }, // hướng dẫn làm quiz
  
  passingScore: { type: Number, default: 70 }, // điểm đạt (phần trăm)
  timeLimit: { type: Number }, // thời gian làm bài (phút), null = không giới hạn
  
  isPublished: { type: Boolean, default: true },
  isRandomized: { type: Boolean, default: false }, // có random thứ tự câu hỏi không
  
  questions: { type: [QuestionSchema], default: [] },
  
  // Quiz settings
  allowRetake: { type: Boolean, default: true }, // cho phép làm lại
  showResults: { type: Boolean, default: true }, // hiển thị kết quả sau khi làm
  showCorrectAnswers: { type: Boolean, default: false }, // hiển thị đáp án đúng
  
  // Stats
  attemptCount: { type: Number, default: 0 }, // số lần làm quiz
  averageScore: { type: Number, default: 0 }, // điểm trung bình
  
}, { timestamps: true });

// Indexes
QuizSchema.index({ courseId: 1, isPublished: 1 });
QuizSchema.index({ moduleId: 1, isPublished: 1 });
QuizSchema.index({ lessonId: 1, isPublished: 1 });

// --- Helper: recalc quiz stats cho 1 course ---
const recalcQuizStats = async (courseId) => {
  try {
    const [agg] = await mongoose.model('Quiz').aggregate([
      { $match: { courseId: new Types.ObjectId(courseId), isPublished: true } },
      { $project: { qCount: { $size: '$questions' } } },
      { $group: { 
        _id: null, 
        quizCount: { $sum: 1 }, 
        totalQuestions: { $sum: '$qCount' } 
      }}
    ]);
    
    const quizCount = agg?.quizCount || 0;
    const totalQuestions = agg?.totalQuestions || 0;
    
    await mongoose.model('Course').updateOne(
      { _id: courseId },
      { 
        $set: { 
          'stats.quizCount': quizCount, 
          'stats.totalQuestions': totalQuestions, 
          'flags.hasQuiz': quizCount > 0,
          'flags.quizRequired': quizCount > 0 // Quiz is required if course has quizzes
        } 
      }
    );
    
    console.log(`✅ Updated quiz stats for course ${courseId}: ${quizCount} quizzes, ${totalQuestions} questions`);
  } catch (error) {
    console.error(`❌ Error recalculating quiz stats for course ${courseId}:`, error);
  }
};

// Tự động đồng bộ sau khi save (tạo / sửa / publish toggle)
QuizSchema.post('save', async function(doc, next) {
  try { 
    if (doc && doc.courseId) {
      await recalcQuizStats(doc.courseId); 
    }
    next(); 
  } catch (e) { 
    console.error('Error in post-save hook:', e);
    next(); // Continue even if stats update fails
  }
});

// Và khi xoá
QuizSchema.post('findOneAndDelete', async function(doc, next) {
  try { 
    if (doc && doc.courseId) {
      await recalcQuizStats(doc.courseId); 
    }
    next(); 
  } catch (e) { 
    console.error('Error in post-delete hook:', e);
    next(); // Continue even if stats update fails
  }
});

// Khi update (đặc biệt là isPublished)
QuizSchema.post('findOneAndUpdate', async function(doc, next) {
  try {
    if (doc && doc.courseId) {
      await recalcQuizStats(doc.courseId);
    }
    next();
  } catch (e) {
    console.error('Error in post-update hook:', e);
    next(); // Continue even if stats update fails
  }
});

// Khi delete nhiều
QuizSchema.post('deleteMany', async function(result, next) {
  try {
    if (result.deletedCount > 0) {
      // Lấy danh sách courseId bị ảnh hưởng
      const affectedCourseIds = await mongoose.model('Quiz').distinct('courseId', {
        _id: { $in: result.deletedIds || [] }
      });
      
      // Recalc cho từng course
      for (const courseId of affectedCourseIds) {
        await recalcQuizStats(courseId);
      }
    }
    next();
  } catch (e) {
    console.error('Error in post-deleteMany hook:', e);
    next(); // Continue even if stats update fails
  }
});

module.exports = mongoose.models.Quiz || mongoose.model('Quiz', QuizSchema);
