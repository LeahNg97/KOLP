// NotificationService.js - Service để quản lý thông báo

export const getDefaultNotifications = (userRole) => {
  const baseNotifications = [
    {
      id: 1,
      title: 'Chào mừng bạn!',
      message: 'Chào mừng bạn đến với nền tảng học tập KOLP',
      time: 'Vừa xong',
      isRead: true,
      type: 'welcome'
    }
  ];

  if (userRole === 'student') {
    return [
      ...baseNotifications,
      {
        id: 2,
        title: 'Khóa học mới',
        message: 'Khóa học "React Advanced" đã được thêm vào danh sách',
        time: '2 giờ trước',
        isRead: false,
        type: 'course'
      },
      {
        id: 3,
        title: 'Bài tập mới',
        message: 'Bài tập mới đã được giao trong khóa học "JavaScript Basics"',
        time: '1 ngày trước',
        isRead: false,
        type: 'assignment'
      },
      {
        id: 4,
        title: 'Điểm số',
        message: 'Bạn đã nhận được điểm cho bài kiểm tra "HTML & CSS"',
        time: '2 ngày trước',
        isRead: true,
        type: 'grade'
      },
      {
        id: 5,
        title: 'Nhắc nhở học tập',
        message: 'Bạn có bài kiểm tra sắp đến trong 3 ngày tới',
        time: '3 ngày trước',
        isRead: false,
        type: 'reminder'
      }
    ];
  }

  if (userRole === 'instructor') {
    return [
      ...baseNotifications,
      {
        id: 2,
        title: 'Học viên mới',
        message: 'Bạn có 5 học viên mới đăng ký khóa học "Web Development"',
        time: '1 giờ trước',
        isRead: false,
        type: 'student'
      },
      {
        id: 3,
        title: 'Bài nộp mới',
        message: 'Học viên Nguyễn Văn A đã nộp bài tập "Project 1"',
        time: '3 giờ trước',
        isRead: false,
        type: 'submission'
      },
      {
        id: 4,
        title: 'Đánh giá khóa học',
        message: 'Khóa học "JavaScript Basics" nhận được đánh giá 5 sao',
        time: '1 ngày trước',
        isRead: true,
        type: 'review'
      },
      {
        id: 5,
        title: 'Nhắc nhở chấm bài',
        message: 'Bạn có 3 bài tập cần chấm điểm trước ngày mai',
        time: '2 ngày trước',
        isRead: false,
        type: 'reminder'
      }
    ];
  }

  return baseNotifications;
};

export const getNotificationIcon = (type) => {
  switch (type) {
    case 'course':
      return '📚';
    case 'assignment':
      return '📝';
    case 'grade':
      return '📊';
    case 'student':
      return '👨‍🎓';
    case 'submission':
      return '📤';
    case 'review':
      return '⭐';
    case 'reminder':
      return '⏰';
    case 'welcome':
      return '🎉';
    default:
      return '🔔';
  }
};

export const getNotificationColor = (type) => {
  switch (type) {
    case 'course':
      return '#667eea';
    case 'assignment':
      return '#ff6b6b';
    case 'grade':
      return '#51cf66';
    case 'student':
      return '#ffd43b';
    case 'submission':
      return '#74c0fc';
    case 'review':
      return '#ffd43b';
    case 'reminder':
      return '#ff922b';
    case 'welcome':
      return '#51cf66';
    default:
      return '#868e96';
  }
};
