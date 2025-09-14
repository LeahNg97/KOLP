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
        title: 'New Course Enrollment Request',
        message: `Student ${enrollment.studentId.name} has enrolled in course "${enrollment.courseId.title}"`,
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
        title: approved ? 'Course Enrollment Approved' : 'Course Enrollment Rejected',
        message: approved 
          ? `Your enrollment in course "${enrollment.courseId.title}" has been approved. You can start learning now!`
          : `Your enrollment in course "${enrollment.courseId.title}" has not been approved. Please contact the instructor for more details.`,
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
          title: 'New Course Needs Approval',
          message: `Instructor ${course.instructorId.name} has created a new course "${course.title}" that needs approval`,
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
        title: approved ? 'Course Approved' : 'Course Rejected',
        message: approved 
          ? `Your course "${course.title}" has been approved and can be published!`
          : `Your course "${course.title}" has not been approved. Reason: ${adminNote}`,
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
        title: 'New Assignment Submitted',
        message: `Student ${student.name} has submitted an assignment in course "${course.title}"`,
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
        title: 'Assignment Graded',
        message: `Your assignment has been graded: ${grade}/100${feedback ? `. Feedback: ${feedback}` : ''}`,
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
          title: 'New Quiz Available',
          message: `A new quiz is now available in course "${course.title}"`,
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
        title: 'Congratulations! You have earned a certificate',
        message: `You have completed the course "${course.title}" and earned a certificate!`,
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
        title: success ? 'Payment Successful' : 'Payment Failed',
        message: success 
          ? `You have successfully paid for course "${course.title}"`
          : `Payment for course "${course.title}" failed. Please try again.`,
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
        title = 'Welcome to KOLP!';
        message = 'Welcome to KOLP online learning platform. Explore our exciting courses!';
      } else if (userRole === 'instructor') {
        title = 'Welcome Instructor!';
        message = 'Welcome to KOLP! You can create and manage your courses.';
      } else {
        title = 'Welcome Admin!';
        message = 'Welcome to KOLP management system.';
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
