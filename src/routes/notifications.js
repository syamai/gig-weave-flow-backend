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

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(skip, skip + take - 1);

  if (read !== undefined) {
    query = query.eq('read', read === 'true');
  }

  const { data: notifications, error: notificationsError } = await query;

  const { count: total, error: countError } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (notificationsError || countError) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }

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

  const { data: notification, error: findError } = await supabase
    .from('notifications')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (findError || !notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  const { data: updatedNotification, error: updateError } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update notification'
    });
  }

  res.json({
    success: true,
    message: 'Notification marked as read',
    data: { notification: updatedNotification }
  });
});

// 모든 알림 읽음 처리
const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read'
    });
  }

  res.json({
    success: true,
    message: 'All notifications marked as read'
  });
});

// 읽지 않은 알림 수 조회
const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const { count: unreadCount, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to get unread count'
    });
  }

  res.json({
    success: true,
    data: { unreadCount }
  });
});

// 알림 삭제
const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const { data: notification, error: findError } = await supabase
    .from('notifications')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (findError || !notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  const { error: deleteError } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }

  res.json({
    success: true,
    message: 'Notification deleted successfully'
  });
});

// 모든 알림 삭제
const deleteAllNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId);

  if (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete all notifications'
    });
  }

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
