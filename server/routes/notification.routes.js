const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notification.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Tất cả routes đều cần authentication
router.use(verifyToken);

// Lấy danh sách thông báo của user
router.get('/', NotificationController.getNotifications);

// Lấy số lượng thông báo chưa đọc
router.get('/unread-count', NotificationController.getUnreadCount);

// Lấy thông báo theo loại
router.get('/by-type', NotificationController.getNotificationsByType);

// Lấy thông báo theo ưu tiên
router.get('/by-priority', NotificationController.getNotificationsByPriority);

// Đánh dấu thông báo đã đọc
router.patch('/:notificationId/read', NotificationController.markAsRead);

// Đánh dấu tất cả thông báo đã đọc
router.patch('/mark-all-read', NotificationController.markAllAsRead);

// Xóa thông báo
router.delete('/:notificationId', NotificationController.deleteNotification);

// Admin routes
// Tạo thông báo thủ công
router.post('/manual', NotificationController.createManualNotification);

// Gửi thông báo hàng loạt
router.post('/bulk', NotificationController.sendBulkNotification);

// Lấy thống kê thông báo
router.get('/stats', NotificationController.getNotificationStats);

module.exports = router;
