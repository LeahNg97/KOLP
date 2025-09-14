// NotificationService.js - Service for managing notifications

export const getDefaultNotifications = (userRole) => {
  const baseNotifications = [
    {
      id: 1,
      title: 'Welcome!',
      message: 'Welcome to KOLP',
      time: 'Just Now',
      isRead: true,
      type: 'welcome'
    }
  ];

  if (userRole === 'student') {
    return [
      ...baseNotifications,
      {
        id: 2,
        title: 'New Course',
        message: 'Course "React Advanced" has been added to the list',
        time: '2 hours ago',
        isRead: false,
        type: 'course'
      },
      {
        id: 3,
        title: 'New Assignment',
        message: 'New assignment has been assigned in the course "JavaScript Basics"',
        time: '1 day ago',
        isRead: false,
        type: 'assignment'
      },
      {
        id: 4,
        title: 'Grade',
        message: 'You have received a grade for the test "HTML & CSS"',
        time: '2 days ago',
        isRead: true,
        type: 'grade'
      },
      {
        id: 5,
        title: 'Reminder',
        message: 'You have a test coming up in 3 days',
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
        title: 'New Student',
        message: 'You have 5 new students enrolled in the course "Web Development"',
        time: '1 hour ago',
        isRead: false,
        type: 'student'
      },
      {
        id: 3,
        title: 'New Submission',
        message: 'Student Nguyen Van A has submitted the assignment "Project 1"',
        time: '3 hours ago',
        isRead: false,
        type: 'submission'
      },
      {
        id: 4,
        title: 'Course Review',
        message: 'Course "JavaScript Basics" has received a 5-star rating',
        time: '1 day ago',
        isRead: true,
        type: 'review'
      },
      {
        id: 5,
        title: 'Reminder',
        message: 'You have 3 assignments that need to be graded before tomorrow',
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
