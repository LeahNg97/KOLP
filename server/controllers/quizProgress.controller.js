const QuizProgress = require('../models/quizProgress.model');
const Quiz = require('../models/quiz.model');
const Course = require('../models/course.model');
const LessonProgress = require('../models/lessonProgress.model');
const Enrollment = require('../models/enrollment.model');
const { asyncHandler } = require('../utils/asyncHandler');

// Get quiz progress for a student in a course
const getQuizProgress = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { studentId } = req.query;
  const userId = req.user.id;

  // Validate course exists
  const course = await Course.findById(courseId);
  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Course not found'
    });
  }

  // Check if course has quiz
  if (!course.flags.hasQuiz) {
    return res.json({
      success: true,
      data: {
        hasQuiz: false,
        quizProgress: null,
        canTakeQuiz: false,
        reason: 'Course does not have a quiz'
      }
    });
  }

  // Get quiz for the course
  const quiz = await Quiz.findOne({ courseId, isPublished: true });
  if (!quiz) {
    return res.json({
      success: true,
      data: {
        hasQuiz: false,
        quizProgress: null,
        canTakeQuiz: false,
        reason: 'Quiz not published'
      }
    });
  }

  // Get lesson progress to check if student can take quiz
  const lessonProgress = await LessonProgress.find({ 
    courseId, 
    studentId: studentId || userId 
  });

  const totalLessons = course.stats.totalLessons || 0;
  const completedLessons = lessonProgress.filter(lp => lp.completed).length;
  const canTakeQuiz = completedLessons >= totalLessons;

  // Get or create quiz progress
  let quizProgress = await QuizProgress.findOne({
    courseId,
    quizId: quiz._id,
    studentId: studentId || userId
  });

  if (!quizProgress) {
    quizProgress = new QuizProgress({
      courseId,
      quizId: quiz._id,
      studentId: studentId || userId,
      totalQuestions: quiz.questions.length
    });
    await quizProgress.save();
  }

  res.json({
    success: true,
    data: {
      hasQuiz: true,
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        instructions: quiz.instructions,
        passingScore: quiz.passingScore,
        timeLimit: quiz.timeLimit,
        totalQuestions: quiz.questions.length
      },
      quizProgress: {
        _id: quizProgress._id,
        score: quizProgress.score,
        totalQuestions: quizProgress.totalQuestions,
        percentage: quizProgress.percentage,
        passed: quizProgress.passed,
        status: quizProgress.status,
        attemptCount: quizProgress.attemptCount,
        maxAttempts: quizProgress.maxAttempts,
        startedAt: quizProgress.startedAt,
        completedAt: quizProgress.completedAt,
        timeSpent: quizProgress.timeSpent
      },
      canTakeQuiz,
      completedLessons,
      totalLessons,
      reason: canTakeQuiz ? null : `Must complete all ${totalLessons} lessons first`
    }
  });
});

// Start quiz attempt
const startQuiz = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user.id;

  // Validate course exists
  const course = await Course.findById(courseId);
  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Course not found'
    });
  }

  // Check if course has quiz
  if (!course.flags.hasQuiz) {
    return res.status(400).json({
      success: false,
      message: 'Course does not have a quiz'
    });
  }

  // Get quiz for the course
  const quiz = await Quiz.findOne({ courseId, isPublished: true });
  if (!quiz) {
    return res.status(400).json({
      success: false,
      message: 'Quiz not published'
    });
  }

  // Check if student can take quiz (completed all lessons)
  const lessonProgress = await LessonProgress.find({ courseId, studentId: userId });
  const totalLessons = course.stats.totalLessons || 0;
  const completedLessons = lessonProgress.filter(lp => lp.completed).length;

  if (completedLessons < totalLessons) {
    return res.status(400).json({
      success: false,
      message: `Must complete all ${totalLessons} lessons before taking the quiz`
    });
  }

  // Get or create quiz progress
  let quizProgress = await QuizProgress.findOne({
    courseId,
    quizId: quiz._id,
    studentId: userId
  });

  if (!quizProgress) {
    quizProgress = new QuizProgress({
      courseId,
      quizId: quiz._id,
      studentId: userId,
      totalQuestions: quiz.questions.length
    });
  }

  // Check if student has exceeded max attempts
  if (quizProgress.attemptCount > quizProgress.maxAttempts) {
    return res.status(400).json({
      success: false,
      message: 'Maximum quiz attempts exceeded'
    });
  }

  // Start quiz
  quizProgress.status = 'in_progress';
  quizProgress.startedAt = new Date();
  await quizProgress.save();

  // Return quiz questions (without correct answers)
  const quizQuestions = quiz.questions.map(q => ({
    questionIndex: quiz.questions.indexOf(q),
    question: q.question,
    options: q.options,
    points: q.points
  }));

  res.json({
    success: true,
    data: {
      quizId: quiz._id,
      title: quiz.title,
      instructions: quiz.instructions,
      passingScore: quiz.passingScore,
      timeLimit: quiz.timeLimit,
      questions: quizQuestions,
      attemptId: quizProgress._id,
      startedAt: quizProgress.startedAt
    }
  });
});

// Submit quiz answers
const submitQuiz = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { attemptId, answers, timeSpent } = req.body;
  const userId = req.user.id;

  // Validate quiz progress exists
  const quizProgress = await QuizProgress.findById(attemptId);
  if (!quizProgress) {
    return res.status(404).json({
      success: false,
      message: 'Quiz attempt not found'
    });
  }

  // Validate ownership
  if (quizProgress.studentId.toString() !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Validate quiz is in progress
  if (quizProgress.status !== 'in_progress') {
    return res.status(400).json({
      success: false,
      message: 'Quiz is not in progress'
    });
  }

  // Get quiz to validate answers
  const quiz = await Quiz.findById(quizProgress.quizId);
  if (!quiz) {
    return res.status(404).json({
      success: false,
      message: 'Quiz not found'
    });
  }

  // Calculate score
  let score = 0;
  const validatedAnswers = [];

  for (let i = 0; i < quiz.questions.length; i++) {
    const question = quiz.questions[i];
    const studentAnswer = answers.find(a => a.questionIndex === i);
    
    if (studentAnswer && studentAnswer.selectedOption === question.correctIndex) {
      score += question.points || 1;
    }

    validatedAnswers.push({
      questionIndex: i,
      selectedOption: studentAnswer ? studentAnswer.selectedOption : -1,
      isCorrect: studentAnswer ? studentAnswer.selectedOption === question.correctIndex : false,
      timeSpent: studentAnswer ? studentAnswer.timeSpent || 0 : 0
    });
  }

  // Update quiz progress
  await quizProgress.updateProgress(score, quiz.questions.length, validatedAnswers, timeSpent);

  // Calculate course progress
  const courseProgress = await calculateCourseProgress(quizProgress.courseId, userId);

  // Update enrollment progress
  try {
    await Enrollment.findOneAndUpdate(
      { courseId: quizProgress.courseId, studentId: userId },
      { 
        $set: { 
          progress: courseProgress.totalProgress,
          lastActivity: new Date()
        }
      }
    );
    console.log(`✅ Updated enrollment progress for student ${userId} in course ${quizProgress.courseId}: ${courseProgress.totalProgress}%`);
  } catch (err) {
    console.error(`❌ Error updating enrollment progress:`, err);
  }

  res.json({
    success: true,
    data: {
      score,
      totalQuestions: quiz.questions.length,
      percentage: quizProgress.percentage,
      passed: quizProgress.passed,
      status: quizProgress.status,
      courseProgress: courseProgress.totalProgress,
      lessonProgress: courseProgress.lessonProgress,
      quizProgress: courseProgress.quizProgress
    }
  });
});

// Get quiz results for review
const getQuizResults = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user.id;

  // Get quiz progress
  const quizProgress = await QuizProgress.findOne({
    courseId,
    studentId: userId
  }).populate('quizId');

  if (!quizProgress) {
    return res.status(404).json({
      success: false,
      message: 'Quiz progress not found'
    });
  }

  // Get quiz with correct answers for review
  const quiz = await Quiz.findById(quizProgress.quizId);
  if (!quiz) {
    return res.status(404).json({
      success: false,
      message: 'Quiz not found'
    });
  }

  // Return results with correct answers
  const results = {
    score: quizProgress.score,
    totalQuestions: quizProgress.totalQuestions,
    percentage: quizProgress.percentage,
    passed: quizProgress.passed,
    status: quizProgress.status,
    attemptCount: quizProgress.attemptCount,
    maxAttempts: quizProgress.maxAttempts,
    timeSpent: quizProgress.timeSpent,
    startedAt: quizProgress.startedAt,
    completedAt: quizProgress.completedAt,
    questions: quiz.questions.map((q, index) => {
      const studentAnswer = quizProgress.answers.find(a => a.questionIndex === index);
      return {
        questionIndex: index,
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        points: q.points,
        studentAnswer: studentAnswer ? studentAnswer.selectedOption : -1,
        isCorrect: studentAnswer ? studentAnswer.isCorrect : false,
        timeSpent: studentAnswer ? studentAnswer.timeSpent : 0
      };
    })
  };

  res.json({
    success: true,
    data: results
  });
});

// Helper function to calculate course progress
const calculateCourseProgress = async (courseId, studentId) => {
  const CourseProgressService = require('../services/courseProgress.service');
  return await CourseProgressService.calculateCourseProgress(courseId, studentId);
};

// Get course progress summary
const getCourseProgress = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user.id;

  const courseProgress = await calculateCourseProgress(courseId, userId);

  res.json({
    success: true,
    data: courseProgress
  });
});

module.exports = {
  getQuizProgress,
  startQuiz,
  submitQuiz,
  getQuizResults,
  getCourseProgress
};
