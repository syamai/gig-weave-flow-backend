const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// 메모리 기반 채널 저장소 (실제로는 Redis 사용 권장)
const channels = new Map();

/**
 * @swagger
 * /api/channels/create:
 *   post:
 *     summary: 실시간 채널 생성 (Supabase Realtime 호환)
 *     tags: [Channels]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - channelName
 *             properties:
 *               channelName:
 *                 type: string
 *                 description: 채널명
 *               config:
 *                 type: object
 *                 description: 채널 설정
 *     responses:
 *       200:
 *         description: 채널 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         channel:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             name:
 *                               type: string
 *                             status:
 *                               type: string
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: 인증 필요
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
const createChannel = asyncHandler(async (req, res) => {
  const { channelName, config = {} } = req.body;
  const userId = req.user.id;

  if (!channelName) {
    return res.status(400).json({
      success: false,
      message: 'Channel name is required'
    });
  }

  const channelId = `channel_${userId}_${Date.now()}`;
  const channel = {
    id: channelId,
    name: channelName,
    userId,
    config,
    status: 'active',
    createdAt: new Date()
  };

  channels.set(channelId, channel);

  res.json({
    success: true,
    data: { channel }
  });
});

/**
 * @swagger
 * /api/channels/subscribe:
 *   post:
 *     summary: 채널 구독 (Supabase Realtime 호환)
 *     tags: [Channels]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - channelId
 *               - event
 *             properties:
 *               channelId:
 *                 type: string
 *                 description: 채널 ID
 *               event:
 *                 type: string
 *                 description: 이벤트 타입
 *               table:
 *                 type: string
 *                 description: 테이블명 (선택사항)
 *               filter:
 *                 type: string
 *                 description: 필터 조건 (선택사항)
 *     responses:
 *       200:
 *         description: 구독 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         subscriptionId:
 *                           type: string
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: 인증 필요
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
const subscribeToChannel = asyncHandler(async (req, res) => {
  const { channelId, event, table, filter } = req.body;
  const userId = req.user.id;

  if (!channelId || !event) {
    return res.status(400).json({
      success: false,
      message: 'Channel ID and event are required'
    });
  }

  const channel = channels.get(channelId);
  if (!channel) {
    return res.status(404).json({
      success: false,
      message: 'Channel not found'
    });
  }

  const subscriptionId = `sub_${userId}_${Date.now()}`;
  const subscription = {
    id: subscriptionId,
    channelId,
    userId,
    event,
    table,
    filter,
    status: 'active',
    createdAt: new Date()
  };

  // TODO: 실제 구독 로직 구현
  // Socket.io를 통해 실시간 구독 설정

  res.json({
    success: true,
    data: {
      subscriptionId,
      subscription
    }
  });
});

/**
 * @swagger
 * /api/channels/unsubscribe:
 *   post:
 *     summary: 채널 구독 해제 (Supabase Realtime 호환)
 *     tags: [Channels]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subscriptionId
 *             properties:
 *               subscriptionId:
 *                 type: string
 *                 description: 구독 ID
 *     responses:
 *       200:
 *         description: 구독 해제 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: 인증 필요
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
const unsubscribeFromChannel = asyncHandler(async (req, res) => {
  const { subscriptionId } = req.body;
  const userId = req.user.id;

  if (!subscriptionId) {
    return res.status(400).json({
      success: false,
      message: 'Subscription ID is required'
    });
  }

  // TODO: 실제 구독 해제 로직 구현
  // Socket.io를 통해 실시간 구독 해제

  res.json({
    success: true,
    message: 'Unsubscribed successfully'
  });
});

/**
 * @swagger
 * /api/channels/list:
 *   get:
 *     summary: 사용자 채널 목록 조회
 *     tags: [Channels]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 채널 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         channels:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               status:
 *                                 type: string
 *                               createdAt:
 *                                 type: string
 *                                 format: date-time
 *       401:
 *         description: 인증 필요
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
const listChannels = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const userChannels = Array.from(channels.values())
    .filter(channel => channel.userId === userId)
    .map(channel => ({
      id: channel.id,
      name: channel.name,
      status: channel.status,
      createdAt: channel.createdAt
    }));

  res.json({
    success: true,
    data: { channels: userChannels }
  });
});

/**
 * @swagger
 * /api/channels/{channelId}:
 *   delete:
 *     summary: 채널 삭제
 *     tags: [Channels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *         description: 채널 ID
 *     responses:
 *       200:
 *         description: 채널 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: 채널을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: 인증 필요
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
const deleteChannel = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const userId = req.user.id;

  const channel = channels.get(channelId);
  if (!channel) {
    return res.status(404).json({
      success: false,
      message: 'Channel not found'
    });
  }

  if (channel.userId !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this channel'
    });
  }

  channels.delete(channelId);

  res.json({
    success: true,
    message: 'Channel deleted successfully'
  });
});

// 보호된 라우트
router.post('/create', authenticateToken, createChannel);
router.post('/subscribe', authenticateToken, subscribeToChannel);
router.post('/unsubscribe', authenticateToken, unsubscribeFromChannel);
router.get('/list', authenticateToken, listChannels);
router.delete('/:channelId', authenticateToken, deleteChannel);

module.exports = router;
