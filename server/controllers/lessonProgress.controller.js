const LessonProgress = require('../models/lessonProgress.model');
const Enrollment = require('../models/enrollment.model');
const Lesson = require('../models/lesson.model');
const { asyncHandler } = require('../utils/asyncHandler');

// Mark lesson as completed
exports.markLessonCompleted = asyncHandler(async (req, res) => {
  const { courseId, lessonId, moduleId } = req.body;
  const studentId = req.user.id;

  // Check if student is enrolled in the course
  const enrollment = await Enrollment.findOne({
    studentId,
    courseId,
    status: 'approved'
  });

  if (!enrollment) {
    return res.status(403).json({
      message: 'You are not enrolled in this course or enrollment is not approved'
    });
  }

  // Create or update lesson progress
  const lessonProgress = await LessonProgress.findOneAndUpdate(
    {
      studentId,
      courseId,
      lessonId
    },
    {
      moduleId,
      completed: true,
      completedAt: new Date(),
      lastAccessedAt: new Date()
    },
    {
      upsert: true,
      new: true,
      runValidators: true
    }
  );

  // Calculate and update overall course progress
  await updateCourseProgress(studentId, courseId);

  res.json({
    message: 'Lesson marked as completed',
    lessonProgress
  });
});

// Mark lesson as incomplete
exports.markLessonIncomplete = asyncHandler(async (req, res) => {
  const { courseId, lessonId } = req.body;
  const studentId = req.user.id;

  // Check if student is enrolled in the course
  const enrollment = await Enrollment.findOne({
    studentId,
    courseId,
    status: 'approved'
  });

  if (!enrollment) {
    return res.status(403).json({
      message: 'You are not enrolled in this course or enrollment is not approved'
    });
  }

  // Update lesson progress
  const lessonProgress = await LessonProgress.findOneAndUpdate(
    {
      studentId,
      courseId,
      lessonId
    },
    {
      completed: false,
      completedAt: null,
      lastAccessedAt: new Date()
    },
    {
      new: true,
      runValidators: true
    }
  );

  if (!lessonProgress) {
    return res.status(404).json({
      message: 'Lesson progress not found'
    });
  }

  // Calculate and update overall course progress
  await updateCourseProgress(studentId, courseId);

  res.json({
    message: 'Lesson marked as incomplete',
    lessonProgress
  });
});

// Get lesson progress for a student in a course
exports.getLessonProgress = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const studentId = req.user.id;

  // Check if student is enrolled in the course
  const enrollment = await Enrollment.findOne({
    studentId,
    courseId,
    status: 'approved'
  });

  if (!enrollment) {
    return res.status(403).json({
      message: 'You are not enrolled in this course or enrollment is not approved'
    });
  }

  const lessonProgress = await LessonProgress.find({
    studentId,
    courseId
  }).populate('lessonId', 'title order');

  // Transform the data to make it easier for frontend to use
  const transformedProgress = lessonProgress.map(progress => ({
    _id: progress._id,
    lessonId: progress.lessonId._id, // Extract the actual lesson ID
    moduleId: progress.moduleId,
    completed: progress.completed,
    completedAt: progress.completedAt,
    timeSpent: progress.timeSpent,
    lastAccessedAt: progress.lastAccessedAt,
    lessonTitle: progress.lessonId?.title,
    lessonOrder: progress.lessonId?.order
  }));

  res.json(transformedProgress);
});

// Get overall course progress for a student
exports.getCourseProgress = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const studentId = req.user.id;

  // Check if student is enrolled in the course
  const enrollment = await Enrollment.findOne({
    studentId,
    courseId,
    status: 'approved'
  });

  if (!enrollment) {
    return res.status(403).json({
      message: 'You are not enrolled in this course or enrollment is not approved'
    });
  }

  const completedLessons = await LessonProgress.countDocuments({
    studentId,
    courseId,
    completed: true
  });

  // Get total lessons from Lesson model instead of LessonProgress
  const totalLessons = await Lesson.countDocuments({
    courseId
  });

  const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  res.json({
    completedLessons,
    totalLessons,
    progress,
    enrollment
  });
});

// Update lesson access time (for tracking time spent)
exports.updateLessonAccess = asyncHandler(async (req, res) => {
  const { courseId, lessonId, moduleId, timeSpent } = req.body;
  const studentId = req.user.id;

  // Check if student is enrolled in the course
  const enrollment = await Enrollment.findOne({
    studentId,
    courseId,
    status: 'approved'
  });

  if (!enrollment) {
    return res.status(403).json({
      message: 'You are not enrolled in this course or enrollment is not approved'
    });
  }

  // Create or update lesson progress
  const lessonProgress = await LessonProgress.findOneAndUpdate(
    {
      studentId,
      courseId,
      lessonId
    },
    {
      moduleId,
      timeSpent: timeSpent || 0,
      lastAccessedAt: new Date()
    },
    {
      upsert: true,
      new: true,
      runValidators: true
    }
  );

  res.json({
    message: 'Lesson access updated',
    lessonProgress
  });
});

// Get lesson progress for instructor to view student progress
exports.getStudentLessonProgress = asyncHandler(async (req, res) => {
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
      message: 'You are not authorized to view this student\'s progress'
    });
  }

  // Check if student is enrolled in the course
  const enrollment = await Enrollment.findOne({
    studentId,
    courseId,
    status: 'approved'
  });

  if (!enrollment) {
    return res.status(404).json({
      message: 'Student is not enrolled in this course or enrollment is not approved'
    });
  }

  const lessonProgress = await LessonProgress.find({
    studentId,
    courseId
  }).populate('lessonId', 'title order');

  // Transform the data to make it easier for frontend to use
  const transformedProgress = lessonProgress.map(progress => ({
    _id: progress._id,
    lessonId: progress.lessonId._id,
    moduleId: progress.moduleId,
    completed: progress.completed,
    completedAt: progress.completedAt,
    timeSpent: progress.timeSpent,
    lastAccessedAt: progress.lastAccessedAt,
    lessonTitle: progress.lessonId?.title,
    lessonOrder: progress.lessonId?.order
  }));

  res.json(transformedProgress);
});

// Get student course progress for instructor
exports.getStudentCourseProgress = asyncHandler(async (req, res) => {
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
      message: 'You are not authorized to view this student\'s progress'
    });
  }

  // Check if student is enrolled in the course
  const enrollment = await Enrollment.findOne({
    studentId,
    courseId,
    status: 'approved'
  });

  if (!enrollment) {
    return res.status(404).json({
      message: 'Student is not enrolled in this course or enrollment is not approved'
    });
  }

  const completedLessons = await LessonProgress.countDocuments({
    studentId,
    courseId,
    completed: true
  });

  // Get total lessons from Lesson model
  const totalLessons = await Lesson.countDocuments({
    courseId
  });

  const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  res.json({
    completedLessons,
    totalLessons,
    progress,
    enrollment
  });
});

// Helper function to update overall course progress
async function updateCourseProgress(studentId, courseId) {
  try {
    const CourseProgressService = require('../services/courseProgress.service');
    await CourseProgressService.updateCourseProgress(courseId, studentId);
  } catch (error) {
    console.error('Error updating course progress:', error);
  }
}
