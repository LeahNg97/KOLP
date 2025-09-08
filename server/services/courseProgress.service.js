const LessonProgress = require('../models/lessonProgress.model');
const QuizProgress = require('../models/quizProgress.model');
const ShortQuestionProgress = require('../models/shortQuestionProgress.model');
const Lesson = require('../models/lesson.model');
const Enrollment = require('../models/enrollment.model');

/**
 * Service để tính toán course progress với tỷ lệ mới:
 * - Lesson Progress: 60%
 * - Quiz Progress: 20%
 * - Short Question Progress: 20%
 */
class CourseProgressService {
  /**
   * Tính toán tổng tiến độ khóa học
   * @param {string} courseId - ID của khóa học
   * @param {string} studentId - ID của học viên
   * @returns {Object} Thông tin tiến độ chi tiết
   */
  static async calculateCourseProgress(courseId, studentId) {
    try {
      // Lấy thông tin lesson progress
      const lessonProgress = await this.calculateLessonProgress(courseId, studentId);
      
      // Lấy thông tin quiz progress
      const quizProgress = await this.calculateQuizProgress(courseId, studentId);
      
      // Lấy thông tin short question progress
      const shortQuestionProgress = await this.calculateShortQuestionProgress(courseId, studentId);
      
      // Tính tổng tiến độ
      const totalProgress = Math.min(
        lessonProgress.percentage + quizProgress.percentage + shortQuestionProgress.percentage,
        100
      );
      
      return {
        totalProgress: Math.round(totalProgress),
        lessonProgress: lessonProgress,
        quizProgress: quizProgress,
        shortQuestionProgress: shortQuestionProgress,
        breakdown: {
          lessonWeight: 60,
          quizWeight: 20,
          shortQuestionWeight: 20
        }
      };
    } catch (error) {
      console.error('Error calculating course progress:', error);
      return {
        totalProgress: 0,
        lessonProgress: { percentage: 0, completed: 0, total: 0 },
        quizProgress: { percentage: 0, passed: false, attempts: 0 },
        shortQuestionProgress: { percentage: 0, passed: false, attempts: 0 },
        breakdown: {
          lessonWeight: 60,
          quizWeight: 20,
          shortQuestionWeight: 20
        }
      };
    }
  }
  
  /**
   * Tính toán tiến độ lesson (60% trọng số)
   * @param {string} courseId - ID của khóa học
   * @param {string} studentId - ID của học viên
   * @returns {Object} Thông tin tiến độ lesson
   */
  static async calculateLessonProgress(courseId, studentId) {
    try {
      // Lấy tổng số lesson trong khóa học
      const totalLessons = await Lesson.countDocuments({ courseId });
      
      if (totalLessons === 0) {
        return {
          percentage: 0,
          completed: 0,
          total: 0,
          weight: 60
        };
      }
      
      // Lấy số lesson đã hoàn thành
      const completedLessons = await LessonProgress.countDocuments({
        courseId,
        studentId,
        completed: true
      });
      
      const percentage = Math.round((completedLessons / totalLessons) * 60);
      
      return {
        percentage,
        completed: completedLessons,
        total: totalLessons,
        weight: 60
      };
    } catch (error) {
      console.error('Error calculating lesson progress:', error);
      return {
        percentage: 0,
        completed: 0,
        total: 0,
        weight: 60
      };
    }
  }
  
  /**
   * Tính toán tiến độ quiz (20% trọng số)
   * @param {string} courseId - ID của khóa học
   * @param {string} studentId - ID của học viên
   * @returns {Object} Thông tin tiến độ quiz
   */
  static async calculateQuizProgress(courseId, studentId) {
    try {
      const quizProgress = await QuizProgress.findOne({ courseId, studentId });
      
      if (!quizProgress) {
        return {
          percentage: 0,
          passed: false,
          attempts: 0,
          score: 0,
          totalQuestions: 0,
          weight: 20
        };
      }
      
      const percentage = quizProgress.passed ? 20 : 0;
      
      return {
        percentage,
        passed: quizProgress.passed,
        attempts: quizProgress.attemptCount || 0,
        score: quizProgress.score || 0,
        totalQuestions: quizProgress.totalQuestions || 0,
        weight: 20
      };
    } catch (error) {
      console.error('Error calculating quiz progress:', error);
      return {
        percentage: 0,
        passed: false,
        attempts: 0,
        score: 0,
        totalQuestions: 0,
        weight: 20
      };
    }
  }
  
  /**
   * Tính toán tiến độ short question (20% trọng số)
   * @param {string} courseId - ID của khóa học
   * @param {string} studentId - ID của học viên
   * @returns {Object} Thông tin tiến độ short question
   */
  static async calculateShortQuestionProgress(courseId, studentId) {
    try {
      // Lấy tất cả short question progress của học viên trong khóa học
      const shortQuestionProgresses = await ShortQuestionProgress.find({
        courseId,
        studentId,
        status: 'completed'
      });
      
      if (shortQuestionProgresses.length === 0) {
        return {
          percentage: 0,
          passed: false,
          attempts: 0,
          totalShortQuestions: 0,
          completedShortQuestions: 0,
          weight: 20
        };
      }
      
      // Tính tỷ lệ short question đã pass
      const passedShortQuestions = shortQuestionProgresses.filter(sp => sp.passed).length;
      const totalShortQuestions = shortQuestionProgresses.length;
      
      // Nếu có ít nhất 1 short question và tất cả đều pass thì được 20%
      // Nếu chỉ pass một phần thì tính theo tỷ lệ
      let percentage = 0;
      if (totalShortQuestions > 0) {
        if (passedShortQuestions === totalShortQuestions) {
          percentage = 20; // Tất cả short question đều pass
        } else {
          percentage = Math.round((passedShortQuestions / totalShortQuestions) * 20);
        }
      }
      
      return {
        percentage,
        passed: passedShortQuestions === totalShortQuestions && totalShortQuestions > 0,
        attempts: shortQuestionProgresses.reduce((sum, sp) => sum + (sp.attemptNumber || 1), 0),
        totalShortQuestions,
        completedShortQuestions: passedShortQuestions,
        weight: 20
      };
    } catch (error) {
      console.error('Error calculating short question progress:', error);
      return {
        percentage: 0,
        passed: false,
        attempts: 0,
        totalShortQuestions: 0,
        completedShortQuestions: 0,
        weight: 20
      };
    }
  }
  
  /**
   * Cập nhật tiến độ khóa học trong enrollment
   * @param {string} courseId - ID của khóa học
   * @param {string} studentId - ID của học viên
   * @returns {Object} Thông tin tiến độ đã cập nhật
   */
  static async updateCourseProgress(courseId, studentId) {
    try {
      const progressData = await this.calculateCourseProgress(courseId, studentId);
      
      // Cập nhật enrollment progress
      await Enrollment.findOneAndUpdate(
        { courseId, studentId },
        { 
          $set: { 
            progress: progressData.totalProgress,
            lastActivity: new Date()
          }
        }
      );
      
      console.log(`✅ Updated course progress for student ${studentId} in course ${courseId}: ${progressData.totalProgress}%`);
      console.log(`   - Lesson: ${progressData.lessonProgress.percentage}% (${progressData.lessonProgress.completed}/${progressData.lessonProgress.total})`);
      console.log(`   - Quiz: ${progressData.quizProgress.percentage}% (${progressData.quizProgress.passed ? 'Passed' : 'Not Passed'})`);
      console.log(`   - Short Questions: ${progressData.shortQuestionProgress.percentage}% (${progressData.shortQuestionProgress.completedShortQuestions}/${progressData.shortQuestionProgress.totalShortQuestions})`);
      
      return progressData;
    } catch (error) {
      console.error('Error updating course progress:', error);
      throw error;
    }
  }
}

module.exports = CourseProgressService;
