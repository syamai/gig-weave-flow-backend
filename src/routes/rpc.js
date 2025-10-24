const express = require('express');
const { supabase } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @swagger
 * /api/rpc/create-notification:
 *   post:
 *     summary: 알림 생성 (RPC 함수)
 *     tags: [RPC Functions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - p_user_id
 *               - p_title
 *               - p_message
 *               - p_type
 *             properties:
 *               p_user_id:
 *                 type: string
 *                 format: uuid
 *                 description: 사용자 ID
 *               p_title:
 *                 type: string
 *                 description: 알림 제목
 *               p_message:
 *                 type: string
 *                 description: 알림 메시지
 *               p_type:
 *                 type: string
 *                 description: 알림 타입
 *               p_link:
 *                 type: string
 *                 description: 링크 (선택사항)
 *     responses:
 *       200:
 *         description: 알림 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: string
 *                       description: 생성된 알림 ID
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
const createNotification = asyncHandler(async (req, res) => {
  const { p_user_id, p_title, p_message, p_type, p_link } = req.body;

  const notification = await prisma.notification.create({
    data: {
      userId: p_user_id,
      title: p_title,
      message: p_message,
      type: p_type,
      link: p_link || null
    }
  });

  res.json({
    success: true,
    data: notification.id
  });
});

/**
 * @swagger
 * /api/rpc/get-user-role:
 *   post:
 *     summary: 사용자 역할 조회 (RPC 함수)
 *     tags: [RPC Functions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - _user_id
 *             properties:
 *               _user_id:
 *                 type: string
 *                 format: uuid
 *                 description: 사용자 ID
 *     responses:
 *       200:
 *         description: 사용자 역할 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: string
 *                       description: 사용자 역할 (client/partner/admin)
 *       404:
 *         description: 사용자 역할을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
const getUserRole = asyncHandler(async (req, res) => {
  const { _user_id } = req.body;

  const userRole = await prisma.userRole.findFirst({
    where: { userId: _user_id },
    select: { role: true }
  });

  if (!userRole) {
    return res.status(404).json({
      success: false,
      message: 'User role not found'
    });
  }

  res.json({
    success: true,
    data: userRole.role
  });
});

/**
 * @swagger
 * /api/rpc/has-role:
 *   post:
 *     summary: 사용자 역할 확인 (RPC 함수)
 *     tags: [RPC Functions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - _user_id
 *               - _role
 *             properties:
 *               _user_id:
 *                 type: string
 *                 format: uuid
 *                 description: 사용자 ID
 *               _role:
 *                 type: string
 *                 enum: [client, partner, admin]
 *                 description: 확인할 역할
 *     responses:
 *       200:
 *         description: 역할 확인 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: boolean
 *                       description: 역할 보유 여부
 */
const hasRole = asyncHandler(async (req, res) => {
  const { _user_id, _role } = req.body;

  const userRole = await prisma.userRole.findFirst({
    where: { 
      userId: _user_id,
      role: _role
    }
  });

  res.json({
    success: true,
    data: !!userRole
  });
});

// 보호된 라우트
router.post('/create-notification', authenticateToken, createNotification);
router.post('/get-user-role', authenticateToken, getUserRole);
router.post('/has-role', authenticateToken, hasRole);

module.exports = router;
