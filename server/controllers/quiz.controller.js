const Quiz = require('../models/quiz.model');
const Course = require('../models/course.model');
const { asyncHandler } = require('../utils/asyncHandler');

// Get all quizzes for a course
const getQuizzesByCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { published } = req.query;

  let filter = { courseId };
  
  // Filter by published status if specified
  if (published !== undefined) {
    filter.isPublished = published === 'true';
  }

  const quizzes = await Quiz.find(filter)
    .select('title description isPublished questions passingScore timeLimit instructions')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: quizzes,
    count: quizzes.length
  });
});

// Get quiz summary for a course (quizCount, totalQuestions)
const getQuizSummary = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const course = await Course.findById(courseId)
    .select('stats.quizCount stats.totalQuestions flags.hasQuiz');

  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Course not found'
    });
  }

  res.json({
    success: true,
    data: {
      quizCount: course.stats.quizCount || 0,
      totalQuestions: course.stats.totalQuestions || 0,
      hasQuiz: course.flags.hasQuiz || false
    }
  });
});

// Create a new quiz
const createQuiz = asyncHandler(async (req, res) => {
  const { courseId, moduleId, lessonId, title, description, questions, passingScore, timeLimit } = req.body;

  // Validate course exists
  const course = await Course.findById(courseId);
  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Course not found'
    });
  }

  // Validate questions
  if (!questions || questions.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Quiz must have at least one question'
    });
  }

  // Validate each question
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    if (!question.question || !question.options || question.options.length < 2) {
      return res.status(400).json({
        success: false,
        message: `Question ${i + 1} must have text and at least 2 options`
      });
    }
    if (question.correctIndex < 0 || question.correctIndex >= question.options.length) {
      return res.status(400).json({
        success: false,
        message: `Question ${i + 1} has invalid correctIndex`
      });
    }
  }

  const quiz = new Quiz({
    courseId,
    moduleId,
    lessonId,
    title,
    description,
    questions,
    passingScore: passingScore || 70,
    timeLimit,
    isPublished: true
  });

  await quiz.save();

  // Quiz stats will be automatically updated via post-save hook

  res.status(201).json({
    success: true,
    message: 'Quiz created successfully',
    data: quiz
  });
});

// Update a quiz
const updateQuiz = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const quiz = await Quiz.findById(id);
  if (!quiz) {
    return res.status(404).json({
      success: false,
      message: 'Quiz not found'
    });
  }

  // If updating questions, validate them
  if (updateData.questions) {
    if (updateData.questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Quiz must have at least one question'
      });
    }

    for (let i = 0; i < updateData.questions.length; i++) {
      const question = updateData.questions[i];
      if (!question.question || !question.options || question.options.length < 2) {
        return res.status(400).json({
          success: false,
          message: `Question ${i + 1} must have text and at least 2 options`
        });
      }
      if (question.correctIndex < 0 || question.correctIndex >= question.options.length) {
        return res.status(400).json({
          success: false,
          message: `Question ${i + 1} has invalid correctIndex`
        });
      }
    }
  }

  const updatedQuiz = await Quiz.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );

  // Quiz stats will be automatically updated via post-update hook

  res.json({
    success: true,
    message: 'Quiz updated successfully',
    data: updatedQuiz
  });
});

// Delete a quiz
const deleteQuiz = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const quiz = await Quiz.findById(id);
  if (!quiz) {
    return res.status(404).json({
      success: false,
      message: 'Quiz not found'
    });
  }

  await Quiz.findByIdAndDelete(id);

  // Quiz stats will be automatically updated via post-delete hook

  res.json({
    success: true,
    message: 'Quiz deleted successfully'
  });
});

// Toggle quiz published status
const toggleQuizPublished = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const quiz = await Quiz.findById(id);
  if (!quiz) {
    return res.status(404).json({
      success: false,
      message: 'Quiz not found'
    });
  }

  quiz.isPublished = !quiz.isPublished;
  await quiz.save();

  // Quiz stats will be automatically updated via post-save hook

  res.json({
    success: true,
    message: `Quiz ${quiz.isPublished ? 'published' : 'unpublished'} successfully`,
    data: quiz
  });
});

// Get quiz by ID
const getQuizById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const quiz = await Quiz.findById(id);
  if (!quiz) {
    return res.status(404).json({
      success: false,
      message: 'Quiz not found'
    });
  }

  res.json({
    success: true,
    data: quiz
  });
});

module.exports = {
  getQuizzesByCourse,
  getQuizSummary,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  toggleQuizPublished,
  getQuizById
};


