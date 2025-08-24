const Lesson = require('../models/lesson.model');
const Module = require('../models/module.model');
const Course = require('../models/course.model');

// Create a new lesson
exports.createLesson = async (req, res, next) => {
  try {
    const { courseId, moduleId, title, description, contentType, url, textContent, durationSec, order, isPreview } = req.body;
    
    // Check if module exists and belongs to the course
    const module = await Module.findById(moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    if (module.courseId.toString() !== courseId) {
      return res.status(400).json({ message: 'Module does not belong to the specified course' });
    }
    
    // Check if user is instructor of this course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    if (course.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not authorized to create lessons for this course' });
    }
    
    // Validate content based on contentType
    if (contentType === 'text' && !textContent) {
      return res.status(400).json({ message: 'Text content is required for text lessons' });
    }
    
    if (contentType !== 'text' && !url) {
      return res.status(400).json({ message: 'URL is required for non-text lessons' });
    }
    
    // Create lesson
    const lesson = new Lesson({
      courseId,
      moduleId,
      title,
      description,
      contentType,
      url: contentType === 'text' ? undefined : url,
      textContent: contentType === 'text' ? textContent : undefined,
      durationSec: durationSec || 0,
      order: order || 1,
      isPreview: isPreview || false
    });
    
    await lesson.save();
    
    // Update course stats
    await Course.updateOne(
      { _id: courseId },
      { 
        $inc: { 
          'stats.totalLessons': 1,
          'stats.totalDurationSec': durationSec || 0
        }
      }
    );
    
    res.status(201).json(lesson);
  } catch (error) {
    next(error);
  }
};

// Get all lessons for a module
exports.getLessonsByModule = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    
    // Check if module exists
    const module = await Module.findById(moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    // Check if user has access to this module's course
    const course = await Course.findById(module.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    if (course.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not authorized to view lessons for this module' });
    }
    
    const lessons = await Lesson.find({ moduleId }).sort({ order: 1 });
    res.json(lessons);
  } catch (error) {
    next(error);
  }
};

// Get lesson by ID
exports.getLessonById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const lesson = await Lesson.findById(id);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }
    
    // Check if user has access to this lesson's course
    const course = await Course.findById(lesson.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    if (course.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not authorized to view this lesson' });
    }
    
    res.json(lesson);
  } catch (error) {
    next(error);
  }
};

// Update lesson
exports.updateLesson = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, contentType, url, textContent, durationSec, order, isPreview } = req.body;
    
    const lesson = await Lesson.findById(id);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }
    
    // Check if user is instructor of this lesson's course
    const course = await Course.findById(lesson.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    if (course.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not authorized to update this lesson' });
    }
    
    // Validate content based on contentType
    if (contentType === 'text' && !textContent) {
      return res.status(400).json({ message: 'Text content is required for text lessons' });
    }
    
    if (contentType !== 'text' && !url) {
      return res.status(400).json({ message: 'URL is required for non-text lessons' });
    }
    
    // Calculate duration difference for stats update
    const oldDuration = lesson.durationSec || 0;
    const newDuration = durationSec || 0;
    const durationDiff = newDuration - oldDuration;
    
    // Update lesson
    const updatedLesson = await Lesson.findByIdAndUpdate(
      id,
      {
        title,
        description,
        contentType,
        url: contentType === 'text' ? undefined : url,
        textContent: contentType === 'text' ? textContent : undefined,
        durationSec: newDuration,
        order,
        isPreview
      },
      { new: true, runValidators: true }
    );
    
    // Update course stats if duration changed
    if (durationDiff !== 0) {
      await Course.updateOne(
        { _id: lesson.courseId },
        { $inc: { 'stats.totalDurationSec': durationDiff } }
      );
    }
    
    res.json(updatedLesson);
  } catch (error) {
    next(error);
  }
};

// Delete lesson
exports.deleteLesson = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const lesson = await Lesson.findById(id);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }
    
    // Check if user is instructor of this lesson's course
    const course = await Course.findById(lesson.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    if (course.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not authorized to delete this lesson' });
    }
    
    // Delete lesson
    await Lesson.findByIdAndDelete(id);
    
    // Update course stats
    await Course.updateOne(
      { _id: lesson.courseId },
      { 
        $inc: { 
          'stats.totalLessons': -1,
          'stats.totalDurationSec': -(lesson.durationSec || 0)
        }
      }
    );
    
    res.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    next(error);
  }
};
