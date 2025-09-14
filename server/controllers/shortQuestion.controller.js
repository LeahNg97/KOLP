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

    // Set status to submitted (waiting for manual grading)
    progress.status = 'submitted';
    progress.submittedAt = new Date();
    progress.timeSpent = timeSpent || 0;
    progress.attemptNumber = (await ShortQuestionProgress.countDocuments({
      shortQuestionId: new Types.ObjectId(id),
      studentId: new Types.ObjectId(studentId)
    })) + 1;
    
    // For manual grading, we don't auto grade or check passed status
    // This will be done by instructor later
    console.log('Short question submitted for manual grading');

    await progress.save();
    console.log('Progress saved successfully');

    // Update course progress using the unified service
    const CourseProgressService = require('../services/courseProgress.service');
    const courseProgress = await CourseProgressService.updateCourseProgress(shortQuestion.courseId, studentId);
    console.log('Course progress updated');

    res.json({
      success: true,
      data: {
        status: progress.status,
        totalQuestions: progress.totalQuestions,
        submittedAt: progress.submittedAt,
        courseProgress
      },
      message: 'Short question submitted successfully. Waiting for instructor grading.'
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

// Get all submitted short questions waiting for grading
const getPendingGradingShortQuestions = asyncHandler(async (req, res) => {
  const instructorId = req.user.id;
  const { courseId } = req.params;

  // Check if instructor owns the course
  const Course = require('../models/course.model');
  const course = await Course.findOne({
    _id: courseId,
    instructorId: instructorId
  });

  if (!course) {
    return res.status(403).json({
      success: false,
      message: 'You are not authorized to view this course'
    });
  }

  // Get all submitted short question progress waiting for grading
  const pendingProgress = await ShortQuestionProgress.find({
    courseId: courseId,
    status: 'submitted'
  })
  .populate('studentId', 'firstName lastName email')
  .populate('shortQuestionId', 'title questions')
  .sort({ submittedAt: -1 });

  res.json({
    success: true,
    data: pendingProgress
  });
});

// Get specific short question progress for grading
const getShortQuestionProgressForGrading = asyncHandler(async (req, res) => {
  const { progressId } = req.params;
  const instructorId = req.user.id;

  const progress = await ShortQuestionProgress.findById(progressId)
    .populate('studentId', 'firstName lastName email')
    .populate('shortQuestionId', 'title questions passingScore')
    .populate('courseId', 'title instructorId');

  if (!progress) {
    return res.status(404).json({
      success: false,
      message: 'Progress not found'
    });
  }

  // Check if instructor owns the course
  if (progress.courseId.instructorId.toString() !== instructorId) {
    return res.status(403).json({
      success: false,
      message: 'You are not authorized to grade this submission'
    });
  }

  res.json({
    success: true,
    data: progress
  });
});

// Grade short question manually
const gradeShortQuestion = asyncHandler(async (req, res) => {
  const { progressId } = req.params;
  const instructorId = req.user.id;
  const { gradedAnswers, overallFeedback, instructorNotes, finalize } = req.body;

  const progress = await ShortQuestionProgress.findById(progressId)
    .populate('shortQuestionId', 'passingScore');

  if (!progress) {
    return res.status(404).json({
      success: false,
      message: 'Progress not found'
    });
  }

  // Check if instructor owns the course
  const Course = require('../models/course.model');
  const course = await Course.findById(progress.courseId);
  if (course.instructorId.toString() !== instructorId) {
    return res.status(403).json({
      success: false,
      message: 'You are not authorized to grade this submission'
    });
  }

  // Apply manual grading
  progress.manualGrade(gradedAnswers, instructorId);
  progress.overallFeedback = overallFeedback || '';
  progress.instructorNotes = instructorNotes || '';

  // If finalize is true, mark as completed
  if (finalize) {
    progress.completeGrading(progress.shortQuestionId.passingScore);
  }

  await progress.save();

  // Update course progress
  const CourseProgressService = require('../services/courseProgress.service');
  await CourseProgressService.updateCourseProgress(progress.courseId, progress.studentId);

  res.json({
    success: true,
    data: {
      score: progress.score,
      totalQuestions: progress.totalQuestions,
      percentage: progress.percentage,
      passed: progress.passed,
      status: progress.status,
      gradedAt: progress.gradedAt
    },
    message: finalize ? 'Short question graded and finalized successfully' : 'Short question graded successfully'
  });
});

// Get student short question progress for instructor
const getStudentShortQuestionProgress = asyncHandler(async (req, res) => {
  const { courseId, studentId } = req.params;
  const instructorId = req.user.id;

  // Check if instructor owns the course
  const Course = require('../models/course.model');
  const course = await Course.findOne({
    _id: courseId,
    instructorId: instructorId
  });

  if (!course) {
    return res.status(403).json({
      success: false,
      message: 'You are not authorized to view this student\'s progress'
    });
  }

  // Check if student is enrolled in the course
  const Enrollment = require('../models/enrollment.model');
  const enrollment = await Enrollment.findOne({
    studentId,
    courseId,
    status: 'approved'
  });

  if (!enrollment) {
    return res.status(404).json({
      success: false,
      message: 'Student is not enrolled in this course or enrollment is not approved'
    });
  }

  // Get all short questions for the course
  const shortQuestions = await ShortQuestion.find({ courseId, isPublished: true });

  if (!shortQuestions || shortQuestions.length === 0) {
    return res.json({
      success: true,
      data: {
        hasShortQuestions: false,
        shortQuestionProgress: null,
        reason: 'Course does not have any short questions'
      }
    });
  }

  // Get short question progress for each short question
  const shortQuestionProgress = [];
  
  for (const shortQuestion of shortQuestions) {
    const progress = await ShortQuestionProgress.findOne({
      courseId,
      shortQuestionId: shortQuestion._id,
      studentId: studentId
    });

    shortQuestionProgress.push({
      shortQuestionId: shortQuestion._id,
      title: shortQuestion.title,
      description: shortQuestion.description,
      totalQuestions: shortQuestion.questions.length,
      passingScore: shortQuestion.passingScore,
      timeLimit: shortQuestion.timeLimit,
      progress: progress ? {
        attemptId: progress.attemptId,
        attemptNumber: progress.attemptNumber,
        score: progress.score,
        totalQuestions: progress.totalQuestions,
        percentage: progress.percentage,
        passed: progress.passed,
        status: progress.status,
        timeSpent: progress.timeSpent,
        startedAt: progress.startedAt,
        submittedAt: progress.submittedAt,
        answers: progress.answers.map(answer => ({
          questionIndex: answer.questionIndex,
          studentAnswer: answer.studentAnswer,
          correctAnswer: answer.correctAnswer,
          isCorrect: answer.isCorrect,
          points: answer.points,
          maxPoints: answer.maxPoints
        }))
      } : null
    });
  }

  res.json({
    success: true,
    data: {
      hasShortQuestions: true,
      shortQuestionProgress,
      totalShortQuestions: shortQuestions.length,
      completedShortQuestions: shortQuestionProgress.filter(sq => sq.progress && sq.progress.status === 'completed').length
    }
  });
});

module.exports = {
  createShortQuestion,
  getShortQuestionsByCourseId,
  getShortQuestionById,
  updateShortQuestion,
  deleteShortQuestion,
  startShortQuestion,
  submitShortQuestion,
  getShortQuestionResults,
  getShortQuestionResultsByCourseId,
  getStudentShortQuestionProgress,
  getPendingGradingShortQuestions,
  getShortQuestionProgressForGrading,
  gradeShortQuestion
};
