// NotificationService.js - Service để quản lý thông báo

export const getDefaultNotifications = (userRole) => {
  const baseNotifications = [
    {
      id: 1,
      title: 'Welcome!',
      message: 'Welcome to KOLP',
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
        title: 'New Course Added',
        message: 'Course "React Advanced" added to your enrolled courses',
        time: '2 hours ago',
        isRead: false,
        type: 'course'
      },
      {
        id: 3,
        title: 'New Assignment',
        message: 'New assignment is added in "JavaScript Basics"',
        time: '1 day ago',
        isRead: false,
        type: 'assignment'
      },
      {
        id: 4,
        title: 'Grade Released',
        message: 'you have been graded for "HTML & CSS"',
        time: '2 days ago',
        isRead: true,
        type: 'grade'
      },
      {
        id: 5,
        title: 'Upcoming Quiz Reminder',
        message: 'Quiz on "React Basics" is scheduled for tomorrow',
        time: '3 days ago',
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
        title: 'New Student Enrollments',
        message: 'You have 5 students enroll in "Web Development"',
        time: '1 hour ago',
        isRead: false,
        type: 'student'
      },
      {
        id: 3,
        title: 'New Assignment Submission',
        message: 'Alice has just submitted "Project 1"',
        time: '3 hours ago',
        isRead: false,
        type: 'submission'
      },
      {
        id: 4,
        title: 'New Course Review',
        message: '"JavaScript Basics" received a new 5-star review',
        time: '1 day ago',
        isRead: true,
        type: 'review'
      },
      {
        id: 5,
        title: 'Grading Reminder',
        message: 'Please grade pending assignments for "HTML & CSS"',
        time: '2 days ago',
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
