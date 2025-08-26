// controllers/course.controller.js

const Course = require('../models/course.model');
const Module = require('../models/module.model');
const Lesson = require('../models/lesson.model');
const Enrollment = require('../models/enrollment.model');

const NotificationService = require('../services/notification.service');

// Helper: sanitize course output
function leanCourse(doc) {
  if (!doc) return null;
  const c = doc.toObject ? doc.toObject() : doc;
  return c;
}

// ==============================
// GET all (admin/instructor view)
// ==============================
exports.getAllCourses = async (req, res, next) => {
  try {
    const courses = await Course.find()
      .populate('instructorId', 'name email role')
      .populate('reviewedBy', 'name email')
      .lean();


    res.json(courses);
  } catch (e) { 
    console.error('Error in getAllCourses:', e);
    next(e); 
  }
};

// ==========================================
// GET active courses (catalog for students)
// Only status = 'active' AND isPublished = true
// ==========================================
exports.getActiveCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({ status: 'active', isPublished: true })
      .populate('instructorId', 'name email role')
      .lean();

    console.log(`Found ${courses.length} active courses`);
    
    // studentCount is now automatically maintained in Course.stats.studentCount
    // No need to calculate it manually
    courses.forEach(c => {
      console.log(`Course ${c._id} (${c.title}): ${c.stats?.studentCount || 0} students (from model)`);
    });

    res.json(courses);
  } catch (e) { 
    console.error('Error in getActiveCourses:', e);
    next(e); 
  }
};

// ==================
// GET one by id
// ==================
exports.getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructorId', 'name email role');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    
    console.log(`Getting course ${req.params.id}: ${course.title}`);
    
    // studentCount is now automatically maintained in Course.stats.studentCount
    const studentCount = course.stats?.studentCount || 0;
    console.log(`Course ${course._id} (${course.title}): ${studentCount} students (from model)`);
    
    // Include quiz stats from the course model
    const quizStats = {
      quizCount: course.stats?.quizCount || 0,
      totalQuestions: course.stats?.totalQuestions || 0,
      hasQuiz: course.flags?.hasQuiz || false
    };
    
    const courseWithStats = { 
      ...leanCourse(course), 
      studentCount,
      quizStats
    };
    
    console.log('Final course with stats:', { 
      id: courseWithStats._id, 
      title: courseWithStats.title, 
      studentCount: courseWithStats.studentCount,
      quizStats: courseWithStats.quizStats
    });
    
    res.json(courseWithStats);
  } catch (e) { 
    console.error('Error in getCourseById:', e);
    next(e); 
  }
};

// ===================================================================
// POST create course (metadata only)
// Optionally you can pass `modules` payload to create syllabus upfront
// ===================================================================
exports.createCourse = async (req, res, next) => {
  try {
    const {
      title,
      subtitle,
      description,
      level,
      priceType = 'free',
      price = 0,
      salePrice,
      currency = 'AUD',
      categoryId,
      tagIds,
      thumbnailUrl,
      promoVideoUrl,
      introductionAssets,
      isPublished = false,
      status = 'pending',
      // optional syllabus seed:
      modules, // [{ title, summary, order, lessons: [{title, description, contentType, url, textContent, durationSec, order, isPreview}] }]
    } = req.body;

    const newCourse = await Course.create({
      title, subtitle, description, level,
      priceType, price, salePrice, currency,
      categoryId, tagIds,
      thumbnailUrl, promoVideoUrl,
      introductionAssets,
      isPublished,
      status,
      instructorId: req.user.id,
    });

    // Optional: seed modules & lessons if provided
    let totalLessons = 0;
    if (Array.isArray(modules) && modules.length) {
      for (const m of modules) {
        const moduleDoc = await Module.create({
          courseId: newCourse._id,
          title: m.title,
          summary: m.summary,
          order: m.order,
        });
        if (Array.isArray(m.lessons)) {
          for (const ls of m.lessons) {
            await Lesson.create({
              courseId: newCourse._id,
              moduleId: moduleDoc._id,
              title: ls.title,
              description: ls.description,
              order: ls.order,
              contentType: ls.contentType,
              url: ls.url,
              textContent: ls.textContent,
              durationSec: ls.durationSec ?? 0,
              isPreview: !!ls.isPreview,
            });
            totalLessons++;
          }
        }
      }
      await Course.findByIdAndUpdate(newCourse._id, {
        $set: { 'stats.totalLessons': totalLessons }
      });
    }

    // Notify admin that a new course is submitted for review
    try {
      await NotificationService.notifyCourseCreated(newCourse._id);
    } catch (err) {
      console.error('Error creating course notification:', err);
    }

    res.status(201).json(leanCourse(newCourse));
  } catch (e) { next(e); }
};

// ============================================
// PUT update course (owner or admin)
// Do NOT allow changing instructorId via body
// ============================================
exports.updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const isOwner = course.instructorId.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You are not allowed to update this course' });
    }

    const {
      // allow list
      title, subtitle, description, level,
      priceType, price, salePrice, currency,
      categoryId, tagIds,
      thumbnailUrl, promoVideoUrl,
      introductionAssets,
      isPublished,
      adminNote, // owner can’t set this; but allow admin below
      reviewedAt, reviewedBy, // ignore unless admin
      status, // owner should use updateCourseStatus; here we ignore to prevent accidental change
    } = req.body;

    // Build safe update
    const update = {
      ...(title !== undefined && { title }),
      ...(subtitle !== undefined && { subtitle }),
      ...(description !== undefined && { description }),
      ...(level !== undefined && { level }),
      ...(priceType !== undefined && { priceType }),
      ...(price !== undefined && { price }),
      ...(salePrice !== undefined && { salePrice }),
      ...(currency !== undefined && { currency }),
      ...(categoryId !== undefined && { categoryId }),
      ...(tagIds !== undefined && { tagIds }),
      ...(thumbnailUrl !== undefined && { thumbnailUrl }),
      ...(promoVideoUrl !== undefined && { promoVideoUrl }),
      ...(introductionAssets !== undefined && { introductionAssets }),
      ...(isPublished !== undefined && { isPublished }),
    };

    // Admin-only fields
    if (isAdmin) {
      if (adminNote !== undefined) update.adminNote = adminNote;
      if (reviewedAt !== undefined) update.reviewedAt = reviewedAt;
      if (reviewedBy !== undefined) update.reviewedBy = reviewedBy;
      if (status !== undefined) update.status = status;
    }

    const updated = await Course.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    ).populate('instructorId', 'name email role');

    res.json(leanCourse(updated));
  } catch (e) { next(e); }
};

// =====================================================
// PATCH instructor updates course status (non-admin)
// Allowed statuses for instructor typically: draft -> pending
// =====================================================
exports.updateCourseStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['draft', 'pending']; // instructor moves course to review
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Instructor can only set status to draft or pending' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (course.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not allowed to change this course status' });
    }

    course.status = status;
    await course.save();
    res.json(leanCourse(course));
  } catch (e) { next(e); }
};

// =======================================================
// PATCH admin approve/reject course
// Only admin can set to 'active' or 'inactive'
// Also stamps reviewedAt/by and optional adminNote
// =======================================================
exports.adminUpdateCourseStatus = async (req, res, next) => {
  try {
    const { status, adminNote, isPublished } = req.body;
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'Admin can only approve (active) or reject (inactive) courses' });
    }

    // Prepare update object
    const updateData = {
      status,
      adminNote: adminNote || null,
      reviewedAt: new Date(),
      reviewedBy: req.user.id
    };

    // If approving (status = 'active'), set isPublished to true and set publishedAt
    // If rejecting (status = 'inactive'), set isPublished to false
    if (status === 'active') {
      updateData.isPublished = true;
      updateData.publishedAt = new Date();
    } else if (status === 'inactive') {
      updateData.isPublished = false;
    }

    // If isPublished is explicitly provided in request, use that value
    if (typeof isPublished === 'boolean') {
      updateData.isPublished = isPublished;
      // If setting to published, also set publishedAt
      if (isPublished && !updateData.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      {
        $set: updateData
      },
      { new: true }
    ).populate('reviewedBy', 'name email');

    if (!course) return res.status(404).json({ message: 'Course not found' });

    try {
      const approved = status === 'active';
      await NotificationService.notifyCourseReview(course._id, approved, adminNote);
    } catch (err) {
      console.error('Error creating course review notification:', err);
    }

    res.json(leanCourse(course));
  } catch (e) { next(e); }
};

// ==================================================
// GET courses by instructor (plus studentCount)
// ==================================================
exports.getCoursesByInstructor = async (req, res, next) => {
  try {
    const courses = await Course.find({ instructorId: req.user.id })
      .populate('instructorId', 'name email role')
      .lean();

    // studentCount is now automatically maintained in Course.stats.studentCount
    // No need to calculate it manually
    courses.forEach(c => {
      console.log(`Course ${c._id} (${c.title}): ${c.stats?.studentCount || 0} students (from model)`);
    });

    res.json(courses);
  } catch (e) { next(e); }
};

// ==================================================
// DELETE course (cascade syllabus)
// ==================================================
exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const isOwner = course.instructorId.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You are not allowed to delete this course' });
    }

    // delete children first
    const modules = await Module.find({ courseId: course._id }, '_id').lean();
    const moduleIds = modules.map(m => m._id);
    await Lesson.deleteMany({ courseId: course._id });
    await Module.deleteMany({ _id: { $in: moduleIds } });

    await Course.findByIdAndDelete(course._id);
    res.json({ message: 'Course deleted' });
  } catch (e) { next(e); }
};

// ==================================================
// (Bonus) GET syllabus for a course
// Hide lesson URLs if user not enrolled and lesson is not preview
// ==================================================
exports.getSyllabus = async (req, res, next) => {
  try {
    const { id: courseId } = req.params;

    // Check enrollment status for the current user
    let enrolled = false;
    let enrollment = null;
    
    if (req.user) {
      enrollment = await Enrollment.findOne({ 
        studentId: req.user.id, 
        courseId,
        status: 'approved' // Only approved enrollments can access content
      });
      enrolled = !!enrollment;
    }

    const modules = await Module.find({ courseId }).sort({ order: 1 }).lean();
    const data = [];
    
    for (const m of modules) {
      const lessons = await Lesson.find({ courseId, moduleId: m._id })
        .sort({ order: 1 })
        .lean();

      const sanitizedLessons = lessons.map(ls => {
        const canView = ls.isPreview || enrolled;
        return {
          _id: ls._id,
          title: ls.title,
          description: ls.description,
          order: ls.order,
          contentType: ls.contentType,
          durationSec: ls.durationSec,
          isPreview: ls.isPreview,
          moduleId: m._id, // Add moduleId to link lessons to modules
          url: canView ? ls.url : undefined,
          textContent: canView ? ls.textContent : undefined,
        };
      });

      data.push({ module: m, lessons: sanitizedLessons });
    }

    // Add enrollment info if user is enrolled
    if (enrollment) {
      res.json({
        data,
        enrollment: {
          status: enrollment.status,
          progress: enrollment.progress,
          approvedAt: enrollment.approvedAt
        }
      });
    } else {
      res.json(data);
    }
    
  } catch (e) { 
    console.error('Error in getSyllabus:', e);
    next(e); 
  }
};

// ==================================================
// Sync course stats with actual data
// ==================================================
exports.syncCourseStats = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    
    // Check if user is admin or instructor of this course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const isAdmin = req.user.role === 'admin';
    const isInstructor = course.instructorId.toString() === req.user.id;
    
    if (!isAdmin && !isInstructor) {
      return res.status(403).json({ message: 'Not authorized to sync course stats' });
    }

    // Count actual approved enrollments
    const approvedEnrollments = await Enrollment.countDocuments({
      courseId,
      status: 'approved'
    });

    // Count actual modules and lessons
    const moduleCount = await Module.countDocuments({ courseId });
    const lessonCount = await Lesson.countDocuments({ courseId });

    // Calculate total duration from lessons
    const lessons = await Lesson.find({ courseId }, 'durationSec');
    const totalDurationSec = lessons.reduce((total, lesson) => total + (lesson.durationSec || 0), 0);

    // Update course stats
    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      {
        'stats.studentCount': approvedEnrollments,
        'stats.totalModules': moduleCount,
        'stats.totalLessons': lessonCount,
        'stats.totalDurationSec': totalDurationSec
      },
      { new: true }
    );

    res.json({
      message: 'Course stats synced successfully',
      stats: updatedCourse.stats,
      actual: {
        approvedEnrollments,
        moduleCount,
        lessonCount,
        totalDurationSec
      }
    });

  } catch (e) {
    console.error('Error syncing course stats:', e);
    next(e);
  }
};
