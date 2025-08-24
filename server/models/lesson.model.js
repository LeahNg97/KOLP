const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const LessonSchema = new Schema({
  courseId: { type: Types.ObjectId, ref: 'Course', required: true, index: true },
  moduleId: { type: Types.ObjectId, ref: 'Module', required: true, index: true },

  title: { type: String, required: true },
  description: { type: String },
  order: { type: Number, required: true, index: true },

  contentType: { type: String, enum: ['video','pdf','slide','text'], required: true },
  url: { type: String },
  textContent: { type: String },
  durationSec: { type: Number, min: 0 },
  isPreview: { type: Boolean, default: false },

  quizId: { type: Types.ObjectId, ref: 'Quiz' },
  assignmentId: { type: Types.ObjectId, ref: 'Assignment' },
}, { timestamps: true });

LessonSchema.index({ moduleId: 1, order: 1 }, { unique: true });

module.exports = mongoose.models.Lesson || mongoose.model('Lesson', LessonSchema);

