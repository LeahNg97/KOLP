const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const ModuleSchema = new Schema({
  courseId: { type: Types.ObjectId, ref: 'Course', required: true, index: true },
  title: { type: String, required: true },
  summary: { type: String },
  order: { type: Number, required: true, index: true },
}, { timestamps: true });

ModuleSchema.index({ courseId: 1, order: 1 }, { unique: true });

module.exports = mongoose.models.Module || mongoose.model('Module', ModuleSchema);

