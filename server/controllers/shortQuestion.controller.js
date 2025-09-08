const mongoose = require('mongoose');
const { Types } = mongoose;
const ShortQuestion = require('../models/shortQuestion.model');
const ShortQuestionProgress = require('../models/shortQuestionProgress.model');
const { asyncHandler } = require('../utils/asyncHandler');

// @desc    Tạo short question mới
// @route   POST /api/short-questions
// @access  Private (Instructor)
const createShortQuestion = asyncHandler(async (req, res) => {
  const { courseId, title, description, instructions, questions, passingScore, timeLimit } = req.body;
  
  // Validate required fields
  if (!courseId || !title || !questions || questions.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Course ID, title, and questions are required'
    });
  }

  // Validate questions
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    if (!question.question || !question.correctAnswer) {
      return res.status(400).json({
        success: false,
        message: `Question ${i + 1} must have question text and correct answer`
      });
    }
  }

  const shortQuestion = await ShortQuestion.create({
    courseId,
    title,
    description,
    instructions,
    questions,
    passingScore: passingScore || 70,
    timeLimit: timeLimit || null
  });

  res.status(201).json({
    success: true,
    data: shortQuestion,
    message: 'Short question created successfully'
  });
});

// @desc    Lấy tất cả short questions của một course
// @route   GET /api/short-questions/course/:courseId
// @access  Private
const getShortQuestionsByCourseId = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  
  const shortQuestions = await ShortQuestion.find({ 
    courseId, 
    isPublished: true 
  }).sort({ createdAt: -1 });

  res.json({
    success: true,
    data: shortQuestions
  });
});

// @desc    Lấy short question theo ID
// @route   GET /api/short-questions/:id
// @access  Private
const getShortQuestionById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const shortQuestion = await ShortQuestion.findById(id);
  
  if (!shortQuestion) {
    return res.status(404).json({
      success: false,
      message: 'Short question not found'
    });
  }

  res.json({
    success: true,
    data: shortQuestion
  });
});

// @desc    Cập nhật short question
// @route   PUT /api/short-questions/:id
// @access  Private (Instructor)
const updateShortQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  
  const shortQuestion = await ShortQuestion.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );
  
  if (!shortQuestion) {
    return res.status(404).json({
      success: false,
      message: 'Short question not found'
    });
  }

  res.json({
    success: true,
    data: shortQuestion,
    message: 'Short question updated successfully'
  });
});

// @desc    Xóa short question
// @route   DELETE /api/short-questions/:id
// @access  Private (Instructor)
const deleteShortQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const shortQuestion = await ShortQuestion.findByIdAndDelete(id);
  
  if (!shortQuestion) {
    return res.status(404).json({
      success: false,
      message: 'Short question not found'
    });
  }

  // Also delete all related progress records
  await ShortQuestionProgress.deleteMany({ shortQuestionId: id });

  res.json({
    success: true,
    message: 'Short question deleted successfully'
  });
});

// @desc    Bắt đầu làm short question
// @route   POST /api/short-questions/:id/start
// @access  Private (Student)
const startShortQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const studentId = req.user.id;
  
  console.log('Starting short question:', id, 'for student:', studentId);
  
  const shortQuestion = await ShortQuestion.findById(id);
  if (!shortQuestion) {
    console.log('Short question not found:', id);
    return res.status(404).json({
      success: false,
      message: 'Short question not found'
    });
  }
  
  console.log('Short question found:', shortQuestion.title);

  // Check if student has already completed this short question
  const completedProgress = await ShortQuestionProgress.findOne({
    shortQuestionId: id,
    studentId,
    status: 'completed'
  });

  if (completedProgress) {
    console.log('Short question already completed:', completedProgress.attemptId);
    return res.status(400).json({
      success: false,
      message: 'You have already completed this short question. You can only attempt it once.'
    });
  }

  // Check if student has an in-progress attempt
  const existingProgress = await ShortQuestionProgress.findOne({
    shortQuestionId: id,
    studentId,
    status: 'in_progress'
  });

  if (existingProgress) {
    console.log('Resuming existing attempt:', existingProgress.attemptId);
    return res.json({
      success: true,
      data: {
        shortQuestion,
        attemptId: existingProgress.attemptId,
        attemptNumber: existingProgress.attemptNumber
      },
      message: 'Resuming existing attempt'
    });
  }

  // Create new attempt with unique ID
  let attemptId;
  let isUnique = false;
  let attempts = 0;
  
  console.log('Generating unique attempt ID...');
  
  while (!isUnique && attempts < 10) {
    attemptId = `sq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const existingAttempt = await ShortQuestionProgress.findOne({ attemptId });
    if (!existingAttempt) {
      isUnique = true;
    }
    attempts++;
  }
  
  if (!isUnique) {
    console.log('Failed to generate unique attempt ID after 10 attempts');
    return res.status(500).json({
      success: false,
      message: 'Failed to generate unique attempt ID'
    });
  }

  
  try {
    // Validate questions array
    if (!shortQuestion.questions || shortQuestion.questions.length === 0) {
      console.log('Short question has no questions');
      return res.status(400).json({
        success: false,
        message: 'Short question has no questions'
      });
    }
    
    console.log('Short question has', shortQuestion.questions.length, 'questions');
    
    const progressData = {
      studentId: new Types.ObjectId(studentId),
      courseId: new Types.ObjectId(shortQuestion.courseId),
      shortQuestionId: new Types.ObjectId(id),
      attemptId,
      totalQuestions: shortQuestion.questions.length,
      answers: shortQuestion.questions.map((q, index) => ({
        questionIndex: index,
        studentAnswer: '', // Empty string is now allowed
        correctAnswer: q.correctAnswer || '',
        maxPoints: q.points || 1, // Default to 1 if points not defined
        timeSpent: 0
      }))
    };
    
    console.log('Creating short question progress with data:', JSON.stringify(progressData, null, 2));
    
    const progress = new ShortQuestionProgress(progressData);
    console.log('ShortQuestionProgress object created successfully');
    
    await progress.save();
    console.log('ShortQuestionProgress saved successfully');

    console.log('Sending success response');
    res.json({
      success: true,
      data: {
        shortQuestion,
        attemptId: progress.attemptId,
        attemptNumber: progress.attemptNumber
      },
      message: 'Short question started successfully'
    });
  } catch (error) {
    console.error('Error creating short question progress:', error);
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    console.error('Error stack:', error.stack);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to start short question',
      error: error.message
    });
  }
});

// @desc    Nộp bài short question
// @route   POST /api/short-questions/:id/submit
// @access  Private (Student)
const submitShortQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { attemptId, answers, timeSpent } = req.body;
  const studentId = req.user.id;
  
  console.log('Submitting short question:', id, 'attemptId:', attemptId, 'studentId:', studentId);
  console.log('Answers received:', answers);
  
  const progress = await ShortQuestionProgress.findOne({
    shortQuestionId: new Types.ObjectId(id),
    attemptId,
    studentId: new Types.ObjectId(studentId),
    status: 'in_progress'
  });

  if (!progress) {
    console.log('Progress not found for attemptId:', attemptId);
    return res.status(404).json({
      success: false,
      message: 'Attempt not found or already submitted'
    });
  }

  console.log('Progress found:', progress._id);

  const shortQuestion = await ShortQuestion.findById(id);
  if (!shortQuestion) {
    console.log('Short question not found:', id);
    return res.status(404).json({
      success: false,
      message: 'Short question not found'
    });
  }

  console.log('Short question found:', shortQuestion.title);

  try {
    // Update answers
    progress.answers = answers.map((answer, index) => ({
      ...answer,
      correctAnswer: shortQuestion.questions[index].correctAnswer,
      maxPoints: shortQuestion.questions[index].points || 1
    }));

    console.log('Updated answers:', progress.answers);

    // Auto grade
    progress.autoGrade();
    console.log('Auto grading completed. Score:', progress.score, 'Percentage:', progress.percentage);
    
    // Check if passed
    progress.checkPassed(shortQuestion.passingScore);
    console.log('Passed check completed. Passed:', progress.passed);
    
    // Update progress
    progress.status = 'completed';
    progress.submittedAt = new Date();
    progress.timeSpent = timeSpent || 0;
    progress.attemptNumber = (await ShortQuestionProgress.countDocuments({
      shortQuestionId: new Types.ObjectId(id),
      studentId: new Types.ObjectId(studentId)
    })) + 1;

    await progress.save();
    console.log('Progress saved successfully');

    // Update course progress using the unified service
    const CourseProgressService = require('../services/courseProgress.service');
    const courseProgress = await CourseProgressService.updateCourseProgress(shortQuestion.courseId, studentId);
    console.log('Course progress updated');

    res.json({
      success: true,
      data: {
        score: progress.score,
        totalQuestions: progress.totalQuestions,
        percentage: progress.percentage,
        passed: progress.passed,
        answers: progress.answers,
        courseProgress
      },
      message: 'Short question submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting short question:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to submit short question',
      error: error.message
    });
  }
});

// @desc    Lấy kết quả short question của student
// @route   GET /api/short-questions/:id/results/:attemptId
// @access  Private (Student)
const getShortQuestionResults = asyncHandler(async (req, res) => {
  const { id, attemptId } = req.params;
  const studentId = req.user.id;
  
  let progress;
  
  if (attemptId) {
    // Get specific attempt results
    progress = await ShortQuestionProgress.findOne({
      shortQuestionId: id,
      attemptId,
      studentId
    });
  } else {
    // Get latest completed results
    progress = await ShortQuestionProgress.findOne({
      shortQuestionId: id,
      studentId,
      status: 'completed'
    }).sort({ submittedAt: -1 });
  }

  if (!progress) {
    return res.status(404).json({
      success: false,
      message: 'Results not found'
    });
  }

  res.json({
    success: true,
    data: progress
  });
});

// @desc    Lấy tất cả kết quả short question của một course (cho instructor)
// @route   GET /api/short-questions/course/:courseId/results
// @access  Private (Instructor)
const getShortQuestionResultsByCourseId = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  
  const results = await ShortQuestionProgress.find({
    courseId,
    status: 'completed'
  })
  .populate('studentId', 'name email')
  .populate('shortQuestionId', 'title')
  .sort({ submittedAt: -1 });

  res.json({
    success: true,
    data: results
  });
});

// Helper function to calculate course progress
const calculateCourseProgress = async (courseId, studentId) => {
  try {
    const CourseProgressService = require('../services/courseProgress.service');
    return await CourseProgressService.calculateCourseProgress(courseId, studentId);
  } catch (error) {
    console.error('Error calculating course progress:', error);
    return {
      totalProgress: 0,
      lessonProgress: { percentage: 0, completed: 0, total: 0 },
      quizProgress: { percentage: 0, passed: false, attempts: 0 },
      shortQuestionProgress: { percentage: 0, passed: false, attempts: 0 }
    };
  }
};

module.exports = {
  createShortQuestion,
  getShortQuestionsByCourseId,
  getShortQuestionById,
  updateShortQuestion,
  deleteShortQuestion,
  startShortQuestion,
  submitShortQuestion,
  getShortQuestionResults,
  getShortQuestionResultsByCourseId
};
