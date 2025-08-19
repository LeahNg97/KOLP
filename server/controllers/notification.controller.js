const NotificationService = require('../services/notification.service');
const { asyncHandler } = require('../utils/asyncHandler');

class NotificationController {
  // Lấy danh sách thông báo của user
  static getNotifications = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user.id;
    
    const skip = (page - 1) * limit;
    const notifications = await NotificationService.getUserNotifications(userId, parseInt(limit), skip);
    
    res.json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: notifications.length
      }
    });
  });

  // Lấy số lượng thông báo chưa đọc
  static getUnreadCount = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const count = await NotificationService.getUnreadCount(userId);
    
    res.json({
      success: true,
      data: { unreadCount: count }
    });
  });

  // Đánh dấu thông báo đã đọc
  static markAsRead = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user.id;
    
    const notification = await NotificationService.markAsRead(notificationId, userId);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Thông báo không tồn tại'
      });
    }
    
    res.json({
      success: true,
      data: notification,
      message: 'Đã đánh dấu thông báo đã đọc'
    });
  });

  // Đánh dấu tất cả thông báo đã đọc
  static markAllAsRead = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    const result = await NotificationService.markAllAsRead(userId);
    
    res.json({
      success: true,
      data: result,
      message: 'Đã đánh dấu tất cả thông báo đã đọc'
    });
  });

  // Xóa thông báo
  static deleteNotification = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user.id;
    
    const notification = await NotificationService.deleteNotification(notificationId, userId);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Thông báo không tồn tại'
      });
    }
    
    res.json({
      success: true,
      message: 'Đã xóa thông báo'
    });
  });

  // Lấy thông báo theo loại
  static getNotificationsByType = asyncHandler(async (req, res) => {
    const { type, page = 1, limit = 20 } = req.query;
    const userId = req.user.id;
    
    const skip = (page - 1) * limit;
    const notifications = await NotificationService.getUserNotificationsByType(
      userId, 
      type, 
      parseInt(limit), 
      skip
    );
    
    res.json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: notifications.length
      }
    });
  });

  // Lấy thông báo theo ưu tiên
  static getNotificationsByPriority = asyncHandler(async (req, res) => {
    const { priority, page = 1, limit = 20 } = req.query;
    const userId = req.user.id;
    
    const skip = (page - 1) * limit;
    const notifications = await NotificationService.getUserNotificationsByPriority(
      userId, 
      priority, 
      parseInt(limit), 
      skip
    );
    
    res.json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: notifications.length
      }
    });
  });

  // Tạo thông báo thủ công (cho admin)
  static createManualNotification = asyncHandler(async (req, res) => {
    const { recipientId, title, message, type, priority = 'medium' } = req.body;
    
    // Kiểm tra quyền admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền tạo thông báo'
      });
    }
    
    const notification = await NotificationService.createNotification({
      recipientId,
      senderId: req.user.id,
      type,
      title,
      message,
      priority,
      metadata: {
        manual: true,
        createdBy: req.user.id
      }
    });
    
    res.status(201).json({
      success: true,
      data: notification,
      message: 'Đã tạo thông báo thành công'
    });
  });

  // Gửi thông báo cho nhiều user (cho admin)
  static sendBulkNotification = asyncHandler(async (req, res) => {
    const { recipientIds, title, message, type, priority = 'medium' } = req.body;
    
    // Kiểm tra quyền admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền gửi thông báo hàng loạt'
      });
    }
    
    const notifications = [];
    for (const recipientId of recipientIds) {
      const notification = await NotificationService.createNotification({
        recipientId,
        senderId: req.user.id,
        type,
        title,
        message,
        priority,
        metadata: {
          bulk: true,
          createdBy: req.user.id
        }
      });
      notifications.push(notification);
    }
    
    res.status(201).json({
      success: true,
      data: notifications,
      message: `Đã gửi thông báo cho ${notifications.length} người dùng`
    });
  });

  // Lấy thống kê thông báo (cho admin)
  static getNotificationStats = asyncHandler(async (req, res) => {
    // Kiểm tra quyền admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền xem thống kê'
      });
    }
    
    const stats = await NotificationService.getNotificationStats();
    
    res.json({
      success: true,
      data: stats
    });
  });
}

module.exports = NotificationController;
