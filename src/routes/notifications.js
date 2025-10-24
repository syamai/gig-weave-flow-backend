const express = require('express');
const { supabase } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// 알림 목록 조회
const getNotifications = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    read
  } = req.query;

  const skip = (page - 1) * limit;
  const take = parseInt(limit);
  const userId = req.user.id;

  const where = { userId };
  if (read !== undefined) {
    where.read = read === 'true';
  }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.notification.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      notifications,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        pages: Math.ceil(total / take)
      }
    }
  });
});

// 알림 읽음 처리
const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const notification = await prisma.notification.findFirst({
    where: {
      id,
      userId
    }
  });

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  const updatedNotification = await prisma.notification.update({
    where: { id },
    data: { read: true }
  });

  res.json({
    success: true,
    message: 'Notification marked as read',
    data: { notification: updatedNotification }
  });
});

// 모든 알림 읽음 처리
const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  await prisma.notification.updateMany({
    where: {
      userId,
      read: false
    },
    data: { read: true }
  });

  res.json({
    success: true,
    message: 'All notifications marked as read'
  });
});

// 읽지 않은 알림 수 조회
const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const unreadCount = await prisma.notification.count({
    where: {
      userId,
      read: false
    }
  });

  res.json({
    success: true,
    data: { unreadCount }
  });
});

// 알림 삭제
const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const notification = await prisma.notification.findFirst({
    where: {
      id,
      userId
    }
  });

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  await prisma.notification.delete({
    where: { id }
  });

  res.json({
    success: true,
    message: 'Notification deleted successfully'
  });
});

// 모든 알림 삭제
const deleteAllNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  await prisma.notification.deleteMany({
    where: { userId }
  });

  res.json({
    success: true,
    message: 'All notifications deleted successfully'
  });
});

// 보호된 라우트
router.get('/', authenticateToken, getNotifications);
router.get('/unread-count', authenticateToken, getUnreadCount);
router.put('/:id/read', authenticateToken, markAsRead);
router.put('/mark-all-read', authenticateToken, markAllAsRead);
router.delete('/:id', authenticateToken, deleteNotification);
router.delete('/', authenticateToken, deleteAllNotifications);

module.exports = router;
