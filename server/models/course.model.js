const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const CourseSchema = new Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, index: true },
  subtitle: { type: String },
  description: { type: String },

  level: { type: String, enum: ['beginner','intermediate','advanced'], default: 'beginner' },

  priceType: { type: String, enum: ['free','paid'], default: 'free' },
  price: { type: Number, min: 0, default: 0 },
  salePrice: { type: Number, min: 0 },
  currency: { type: String, default: 'AUD' }, // gợi ý dùng AUD cho dự án ở Úc

  instructorId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
  coInstructorIds: [{ type: Types.ObjectId, ref: 'User' }],

  thumbnailUrl: { type: String },
  promoVideoUrl: { type: String },

  introductionAssets: [{
    kind: { type: String, enum: ['video','image','text'], required: true },
    url: { type: String },
    title: { type: String },
    description: { type: String },
    textContent: { type: String }
  }],

  categoryId: { type: Types.ObjectId, ref: 'Category', index: true },
  tagIds: [{ type: Types.ObjectId, ref: 'Tag' }],
  isPublished: { type: Boolean, default: false },
  publishedAt: { type: Date },

  status: { type: String, enum: ['pending','active','inactive','draft'], default: 'pending' },
  adminNote: { type: String },
  reviewedAt: { type: Date },
  reviewedBy: { type: Types.ObjectId, ref: 'User' },

  stats: {
    totalLessons: { type: Number, default: 0 },
    totalDurationSec: { type: Number, default: 0 },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    studentCount: { type: Number, default: 0 },
    quizCount: { type: Number, default: 0 },       // số quiz đã publish
    totalQuestions: { type: Number, default: 0 },  // tổng câu hỏi của tất cả quiz publish
  },
  flags: {
    hasQuiz: { type: Boolean, default: false },    // để show badge nhanh
    quizRequired: { type: Boolean, default: false } // quiz có bắt buộc để hoàn thành course không
  },
}, { timestamps: true });

CourseSchema.pre('save', function(next) {
  if (!this.isModified('title') && this.slug) return next();
  if (!this.title) return next();
  const base = String(this.title).toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  this.slug = `${base}-${Math.random().toString(36).slice(2,7)}`;
  next();
});

CourseSchema.index({ isPublished: 1, categoryId: 1, priceType: 1 });
CourseSchema.index({ title: 'text', subtitle: 'text', description: 'text' });

module.exports = mongoose.models.Course || mongoose.model('Course', CourseSchema);
