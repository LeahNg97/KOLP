const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Introduction content (visible to all students)
  introductionContent: [
    {
      type: {
        type: String,
        enum: ['video', 'image', 'text'],
        required: true
      },
      url: { type: String, required: true },
      title: { type: String },
      description: { type: String }
    }
  ],
  // Full course content (visible only to accepted students)
  content: [
    {
      type: {
        type: String,
        enum: ['video', 'pdf', 'slide', 'text'],
        required: true
      },
      url: { type: String, required: true },
      title: { type: String },
      description: { type: String }
    }
  ],
  imageIntroduction: { type: String },// Image URL for course introduction, vì là đường link
  status: { 
    type: String, 
    enum: ['pending', 'active', 'inactive', 'draft'], // bắt buộc phải là 1 trong 4 trạng thái
    default: 'pending' 
  },
  adminNote: { type: String },
  reviewedAt: { type: Date },
  reviewedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
}, { timestamps: true });

module.exports = mongoose.models.Course || mongoose.model('Course', courseSchema);