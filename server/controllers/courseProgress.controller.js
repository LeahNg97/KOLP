const CourseProgressService = require('../services/courseProgress.service');
const { asyncHandler } = require('../utils/asyncHandler');

// @desc    Get detailed course progress breakdown
// @route   GET /api/course-progress/:courseId
// @access  Private (Student)
const getCourseProgressBreakdown = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const studentId = req.user.id;

  try {
    const progressData = await CourseProgressService.calculateCourseProgress(courseId, studentId);
    
    res.json({
      success: true,
      data: progressData
    });
  } catch (error) {
    console.error('Error getting course progress breakdown:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get course progress breakdown'
    });
  }
});

// @desc    Update course progress (triggered by lesson/quiz/short question completion)
// @route   POST /api/course-progress/:courseId/update
// @access  Private (Student)
const updateCourseProgress = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const studentId = req.user.id;

  try {
    const progressData = await CourseProgressService.updateCourseProgress(courseId, studentId);
    
    res.json({
      success: true,
      data: progressData,
      message: 'Course progress updated successfully'
    });
  } catch (error) {
    console.error('Error updating course progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update course progress'
    });
  }
});

module.exports = {
  getCourseProgressBreakdown,
  updateCourseProgress
};
