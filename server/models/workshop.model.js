const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const WorkshopSchema = new Schema({
  // Nội dung chính
  title: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, index: true },
  description: { type: String },

  // Người đăng
  instructorId: { type: Types.ObjectId, ref: 'User', required: true, index: true },

  // Thời gian và lịch
  startAt: { type: Date, required: true, index: true },
  endAt: { type: Date, required: true, index: true },
  timeZone: { type: String, default: 'Asia/Bangkok' },

  // Thông tin phòng họp
  meetingUrl: { type: String, required: true, trim: true },
  meetingProvider: { type: String, enum: ['google_meet','zoom','teams','other'], default: 'google_meet' },

  // Trạng thái
  status: { 
    type: String, 
    enum: ['scheduled','live','completed','canceled'], 
    default: 'scheduled', 
    index: true 
  },

  // Cờ và meta
  isPublished: { type: Boolean, default: true },
  publishedAt: { type: Date },

  // Thông tin bổ sung
  maxParticipants: { type: Number, default: 50 },
  currentParticipants: { type: Number, default: 0 },
  
  // Thông tin đăng ký
  registrationRequired: { type: Boolean, default: true },
  registrationDeadline: { type: Date },
  
  // Thông tin phí
  price: { type: Number, min: 0, default: 0 },
  currency: { type: String, default: 'AUD' },
  
  // Thông tin bổ sung
  requirements: { type: String },
  materials: [{ type: String }],
  
  // Thống kê
  stats: {
    totalRegistrations: { type: Number, default: 0 },
    totalAttendees: { type: Number, default: 0 },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 }
  }
}, { timestamps: true });

// Tạo slug tự động từ title
WorkshopSchema.pre('save', function(next) {
  if (!this.isModified('title') && this.slug) return next();
  if (!this.title) return next();
  const base = String(this.title).toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  this.slug = `${base}-${Math.random().toString(36).slice(2,7)}`;
  next();
});

// Indexes để tối ưu query
WorkshopSchema.index({ isPublished: 1, status: 1, startAt: 1 });
WorkshopSchema.index({ instructorId: 1, status: 1 });
WorkshopSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.models.Workshop || mongoose.model('Workshop', WorkshopSchema);
