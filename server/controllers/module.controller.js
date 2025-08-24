const Module = require('../models/module.model');
const Course = require('../models/course.model');

// Create a new module
exports.createModule = async (req, res, next) => {
  try {
    const { courseId, title, summary, order } = req.body;
    
    // Check if user is instructor of this course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    if (course.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not authorized to create modules for this course' });
    }
    
    // Create module
    const module = new Module({
      courseId,
      title,
      summary,
      order: order || 1
    });
    
    await module.save();
    
    // Update course stats
    await Course.updateOne(
      { _id: courseId },
      { $inc: { 'stats.totalModules': 1 } }
    );
    
    res.status(201).json(module);
  } catch (error) {
    next(error);
  }
};

// Get all modules for a course
exports.getModulesByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    
    // Check if user has access to this course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    if (course.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not authorized to view modules for this course' });
    }
    
    const modules = await Module.find({ courseId }).sort({ order: 1 });
    res.json(modules);
  } catch (error) {
    next(error);
  }
};

// Get module by ID
exports.getModuleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const module = await Module.findById(id);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    // Check if user has access to this module's course
    const course = await Course.findById(module.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    if (course.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not authorized to view this module' });
    }
    
    res.json(module);
  } catch (error) {
    next(error);
  }
};

// Update module
exports.updateModule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, summary, order } = req.body;
    
    const module = await Module.findById(id);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    // Check if user is instructor of this module's course
    const course = await Course.findById(module.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    if (course.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not authorized to update this module' });
    }
    
    // Update module
    const updatedModule = await Module.findByIdAndUpdate(
      id,
      { title, summary, order },
      { new: true, runValidators: true }
    );
    
    res.json(updatedModule);
  } catch (error) {
    next(error);
  }
};

// Delete module
exports.deleteModule = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const module = await Module.findById(id);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    // Check if user is instructor of this module's course
    const course = await Course.findById(module.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    if (course.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not authorized to delete this module' });
    }
    
    // Delete module (lessons will be deleted by cascade)
    await Module.findByIdAndDelete(id);
    
    // Update course stats
    await Course.updateOne(
      { _id: module.courseId },
      { $inc: { 'stats.totalModules': -1 } }
    );
    
    res.json({ message: 'Module deleted successfully' });
  } catch (error) {
    next(error);
  }
};
