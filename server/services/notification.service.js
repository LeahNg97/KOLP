const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const Course = require('../models/course.model');
const Enrollment = require('../models/enrollment.model');

class NotificationService {
  // Tạo thông báo mới
  static async createNotification(notificationData) {
    try {
      const notification = new Notification(notificationData);
      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Tạo thông báo đăng ký khóa học cho instructor
  static async notifyEnrollmentRequest(enrollmentId) {
    try {
      const enrollment = await Enrollment.findById(enrollmentId)
        .populate('studentId', 'name')
        .populate('courseId', 'title instructorId');

      if (!enrollment) return;

      const notification = await this.createNotification({
        recipientId: enrollment.courseId.instructorId,
        senderId: enrollment.studentId._id,
        type: 'enrollment_request',
        title: 'Yêu cầu đăng ký khóa học mới',
        message: `Học sinh ${enrollment.studentId.name} đã đăng ký khóa học "${enrollment.courseId.title}"`,
        relatedId: enrollmentId,
        relatedModel: 'Enrollment',
        priority: 'medium',
        metadata: {
          studentName: enrollment.studentId.name,
          courseTitle: enrollment.courseId.title,
          enrollmentId: enrollmentId
        }
      });

      return notification;
    } catch (error) {
      console.error('Error notifying enrollment request:', error);
    }
  }

  // Tạo thông báo duyệt khóa học cho học sinh
  static async notifyEnrollmentApproval(enrollmentId, approved = true) {
    try {
      const enrollment = await Enrollment.findById(enrollmentId)
        .populate('studentId', 'name')
        .populate('courseId', 'title');

      if (!enrollment) return;

      const notification = await this.createNotification({
        recipientId: enrollment.studentId._id,
        type: approved ? 'enrollment_approved' : 'enrollment_rejected',
        title: approved ? 'Đăng ký khóa học được duyệt' : 'Đăng ký khóa học bị từ chối',
        message: approved 
          ? `Khóa học "${enrollment.courseId.title}" của bạn đã được duyệt. Bạn có thể bắt đầu học ngay!`
          : `Khóa học "${enrollment.courseId.title}" của bạn chưa được duyệt. Vui lòng liên hệ instructor để biết thêm chi tiết.`,
        relatedId: enrollmentId,
        relatedModel: 'Enrollment',
        priority: approved ? 'high' : 'medium',
        metadata: {
          courseTitle: enrollment.courseId.title,
          enrollmentId: enrollmentId,
          approved: approved
        }
      });

      return notification;
    } catch (error) {
      console.error('Error notifying enrollment approval:', error);
    }
  }

  // Tạo thông báo khóa học mới cho admin
  static async notifyCourseCreated(courseId) {
    try {
      const course = await Course.findById(courseId)
        .populate('instructorId', 'name');

      if (!course) return;

      // Tìm tất cả admin users
      const adminUsers = await User.find({ role: 'admin' });
      
      const notifications = [];
      for (const admin of adminUsers) {
        const notification = await this.createNotification({
          recipientId: admin._id,
          senderId: course.instructorId._id,
          type: 'course_created',
          title: 'Khóa học mới cần duyệt',
          message: `Instructor ${course.instructorId.name} đã tạo khóa học mới "${course.title}" cần được duyệt`,
          relatedId: courseId,
          relatedModel: 'Course',
          priority: 'medium',
          metadata: {
            instructorName: course.instructorId.name,
            courseTitle: course.title,
            courseId: courseId
          }
        });
        notifications.push(notification);
      }

      return notifications;
    } catch (error) {
      console.error('Error notifying course created:', error);
    }
  }

  // Tạo thông báo khóa học được duyệt/từ chối cho instructor
  static async notifyCourseReview(courseId, approved = true, adminNote = '') {
    try {
      const course = await Course.findById(courseId)
        .populate('instructorId', 'name');

      if (!course) return;

      const notification = await this.createNotification({
        recipientId: course.instructorId._id,
        type: approved ? 'course_approved' : 'course_rejected',
        title: approved ? 'Khóa học được duyệt' : 'Khóa học bị từ chối',
        message: approved 
          ? `Khóa học "${course.title}" của bạn đã được duyệt và có thể xuất bản!`
          : `Khóa học "${course.title}" của bạn chưa được duyệt. Lý do: ${adminNote}`,
        relatedId: courseId,
        relatedModel: 'Course',
        priority: approved ? 'high' : 'medium',
        metadata: {
          courseTitle: course.title,
          courseId: courseId,
          approved: approved,
          adminNote: adminNote
        }
      });

      return notification;
    } catch (error) {
      console.error('Error notifying course review:', error);
    }
  }

  // Tạo thông báo bài tập được nộp cho instructor
  static async notifyAssignmentSubmission(assignmentId, studentId, courseId) {
    try {
      const student = await User.findById(studentId);
      const course = await Course.findById(courseId);

      if (!student || !course) return;

      const notification = await this.createNotification({
        recipientId: course.instructorId,
        senderId: studentId,
        type: 'assignment_submitted',
        title: 'Bài tập mới được nộp',
        message: `Học sinh ${student.name} đã nộp bài tập trong khóa học "${course.title}"`,
        relatedId: assignmentId,
        relatedModel: 'Assignment',
        priority: 'medium',
        metadata: {
          studentName: student.name,
          courseTitle: course.title,
          assignmentId: assignmentId
        }
      });

      return notification;
    } catch (error) {
      console.error('Error notifying assignment submission:', error);
    }
  }

  // Tạo thông báo bài tập được chấm điểm cho học sinh
  static async notifyAssignmentGraded(assignmentId, studentId, grade, feedback = '') {
    try {
      const student = await User.findById(studentId);

      if (!student) return;

      const notification = await this.createNotification({
        recipientId: studentId,
        type: 'assignment_graded',
        title: 'Bài tập đã được chấm điểm',
        message: `Bài tập của bạn đã được chấm điểm: ${grade}/100${feedback ? `. Phản hồi: ${feedback}` : ''}`,
        relatedId: assignmentId,
        relatedModel: 'Assignment',
        priority: 'high',
        metadata: {
          grade: grade,
          feedback: feedback,
          assignmentId: assignmentId
        }
      });

      return notification;
    } catch (error) {
      console.error('Error notifying assignment graded:', error);
    }
  }

  // Tạo thông báo quiz mới cho học sinh
  static async notifyQuizAvailable(quizId, courseId, studentIds) {
    try {
      const course = await Course.findById(courseId);

      if (!course) return;

      const notifications = [];
      for (const studentId of studentIds) {
        const notification = await this.createNotification({
          recipientId: studentId,
          type: 'quiz_available',
          title: 'Quiz mới có sẵn',
          message: `Quiz mới đã có sẵn trong khóa học "${course.title}"`,
          relatedId: quizId,
          relatedModel: 'Quiz',
          priority: 'medium',
          metadata: {
            courseTitle: course.title,
            quizId: quizId
          }
        });
        notifications.push(notification);
      }

      return notifications;
    } catch (error) {
      console.error('Error notifying quiz available:', error);
    }
  }

  // Tạo thông báo chứng chỉ cho học sinh
  static async notifyCertificateEarned(certificateId, studentId, courseId) {
    try {
      const course = await Course.findById(courseId);

      if (!course) return;

      const notification = await this.createNotification({
        recipientId: studentId,
        type: 'certificate_earned',
        title: 'Chúc mừng! Bạn đã nhận được chứng chỉ',
        message: `Bạn đã hoàn thành khóa học "${course.title}" và nhận được chứng chỉ!`,
        relatedId: certificateId,
        relatedModel: 'Certificate',
        priority: 'high',
        metadata: {
          courseTitle: course.title,
          certificateId: certificateId
        }
      });

      return notification;
    } catch (error) {
      console.error('Error notifying certificate earned:', error);
    }
  }

  // Tạo thông báo thanh toán
  static async notifyPayment(paymentId, studentId, courseId, success = true) {
    try {
      const course = await Course.findById(courseId);

      if (!course) return;

      const notification = await this.createNotification({
        recipientId: studentId,
        type: success ? 'payment_success' : 'payment_failed',
        title: success ? 'Thanh toán thành công' : 'Thanh toán thất bại',
        message: success 
          ? `Bạn đã thanh toán thành công khóa học "${course.title}"`
          : `Thanh toán khóa học "${course.title}" thất bại. Vui lòng thử lại.`,
        relatedId: paymentId,
        relatedModel: 'Payment',
        priority: success ? 'high' : 'urgent',
        metadata: {
          courseTitle: course.title,
          paymentId: paymentId,
          success: success
        }
      });

      return notification;
    } catch (error) {
      console.error('Error notifying payment:', error);
    }
  }

  // Tạo thông báo chào mừng cho user mới
  static async notifyWelcome(userId, userRole) {
    try {
      let title, message;
      
      if (userRole === 'student') {
        title = 'Chào mừng bạn đến với KOLP!';
        message = 'Chào mừng bạn đến với nền tảng học tập trực tuyến KOLP. Hãy khám phá các khóa học thú vị!';
      } else if (userRole === 'instructor') {
        title = 'Chào mừng Instructor!';
        message = 'Chào mừng bạn đến với KOLP! Bạn có thể tạo và quản lý các khóa học của mình.';
      } else {
        title = 'Chào mừng Admin!';
        message = 'Chào mừng bạn đến với hệ thống quản lý KOLP.';
      }

      const notification = await this.createNotification({
        recipientId: userId,
        type: 'welcome',
        title: title,
        message: message,
        priority: 'low',
        metadata: {
          userRole: userRole
        }
      });

      return notification;
    } catch (error) {
      console.error('Error notifying welcome:', error);
    }
  }

  // Lấy thông báo của user
  static async getUserNotifications(userId, limit = 20, skip = 0) {
    try {
      const notifications = await Notification.find({
        recipientId: userId,
        isDeleted: false
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('senderId', 'name')
      .populate('relatedId');

      return notifications;
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  // Lấy thông báo của user theo loại
  static async getUserNotificationsByType(userId, type, limit = 20, skip = 0) {
    try {
      const notifications = await Notification.find({
        recipientId: userId,
        type: type,
        isDeleted: false
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('senderId', 'name')
      .populate('relatedId');

      return notifications;
    } catch (error) {
      console.error('Error getting user notifications by type:', error);
      throw error;
    }
  }

  // Lấy thông báo của user theo ưu tiên
  static async getUserNotificationsByPriority(userId, priority, limit = 20, skip = 0) {
    try {
      const notifications = await Notification.find({
        recipientId: userId,
        priority: priority,
        isDeleted: false
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('senderId', 'name')
      .populate('relatedId');

      return notifications;
    } catch (error) {
      console.error('Error getting user notifications by priority:', error);
      throw error;
    }
  }

  // Lấy thống kê thông báo
  static async getNotificationStats() {
    try {
      const totalNotifications = await Notification.countDocuments({ isDeleted: false });
      const unreadNotifications = await Notification.countDocuments({ isRead: false, isDeleted: false });
      const todayNotifications = await Notification.countDocuments({
        createdAt: { $gte: new Date().setHours(0, 0, 0, 0) },
        isDeleted: false
      });

      const typeStats = await Notification.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      const priorityStats = await Notification.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      return {
        total: totalNotifications,
        unread: unreadNotifications,
        today: todayNotifications,
        byType: typeStats,
        byPriority: priorityStats
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      throw error;
    }
  }

  // Đếm thông báo chưa đọc
  static async getUnreadCount(userId) {
    try {
      const count = await Notification.countDocuments({
        recipientId: userId,
        isRead: false,
        isDeleted: false
      });
      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  // Đánh dấu thông báo đã đọc
  static async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, recipientId: userId },
        { isRead: true },
        { new: true }
      );
      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Đánh dấu tất cả thông báo đã đọc
  static async markAllAsRead(userId) {
    try {
      const result = await Notification.updateMany(
        { recipientId: userId, isRead: false },
        { isRead: true }
      );
      return result;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Xóa thông báo (soft delete)
  static async deleteNotification(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, recipientId: userId },
        { isDeleted: true },
        { new: true }
      );
      return notification;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;
