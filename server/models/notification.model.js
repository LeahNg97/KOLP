const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: [
      'enrollment_request',      // Học sinh đăng ký khóa học
      'enrollment_approved',     // Học sinh được duyệt khóa học
      'enrollment_rejected',     // Học sinh bị từ chối khóa học
      'course_created',          // Khóa học mới được tạo
      'course_approved',         // Khóa học được admin duyệt
      'course_rejected',         // Khóa học bị admin từ chối
      'assignment_submitted',    // Bài tập được nộp
      'assignment_graded',       // Bài tập được chấm điểm
      'quiz_available',          // Quiz mới có sẵn
      'quiz_completed',          // Quiz được hoàn thành
      'certificate_earned',      // Chứng chỉ được trao
      'payment_success',         // Thanh toán thành công
      'payment_failed',          // Thanh toán thất bại
      'system_message',          // Thông báo hệ thống
      'welcome'                  // Chào mừng
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedModel'
  },
  relatedModel: {
    type: String,
    enum: ['Course', 'Enrollment', 'Quiz', 'Assignment', 'Certificate', 'Payment'],
    required: false
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { 
  timestamps: true 
});

// Index để tối ưu truy vấn
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, relatedId: 1 });
notificationSchema.index({ createdAt: -1 });

// Virtual để tính thời gian tương đối
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diffInSeconds = Math.floor((now - this.createdAt) / 1000);
  
  if (diffInSeconds < 60) return 'Vừa xong';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} tháng trước`;
  return `${Math.floor(diffInSeconds / 31536000)} năm trước`;
});

// Method để đánh dấu đã đọc
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  return this.save();
};

// Method để đánh dấu tất cả đã đọc
notificationSchema.statics.markAllAsRead = function(recipientId) {
  return this.updateMany(
    { recipientId, isRead: false },
    { isRead: true }
  );
};

// Method để xóa mềm
notificationSchema.methods.softDelete = function() {
  this.isDeleted = true;
  return this.save();
};

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
