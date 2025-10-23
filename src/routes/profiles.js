const express = require('express');
const { prisma } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @swagger
 * /api/profiles/avatar:
 *   post:
 *     summary: 프로필 이미지 업로드
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: 업로드할 프로필 이미지
 *     responses:
 *       200:
 *         description: 프로필 이미지 업로드 성공
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
 *                         avatarUrl:
 *                           type: string
 *                           description: 업로드된 프로필 이미지 URL
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
const uploadAvatar = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { avatarUrl } = req.body;

  if (!avatarUrl) {
    return res.status(400).json({
      success: false,
      message: 'Avatar URL is required'
    });
  }

  const profile = await prisma.profile.update({
    where: { id: userId },
    data: { avatarUrl }
  });

  res.json({
    success: true,
    data: { avatarUrl: profile.avatarUrl }
  });
});

/**
 * @swagger
 * /api/profiles/avatar:
 *   delete:
 *     summary: 프로필 이미지 삭제
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 프로필 이미지 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: 인증 필요
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
const deleteAvatar = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  await prisma.profile.update({
    where: { id: userId },
    data: { avatarUrl: null }
  });

  res.json({
    success: true,
    message: 'Avatar deleted successfully'
  });
});

/**
 * @swagger
 * /api/profiles/{id}:
 *   get:
 *     summary: 프로필 조회
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 사용자 ID
 *     responses:
 *       200:
 *         description: 프로필 조회 성공
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
 *                         profile:
 *                           $ref: '#/components/schemas/Profile'
 *       404:
 *         description: 프로필을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
const getProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const profile = await prisma.profile.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      avatarUrl: true,
      createdAt: true
    }
  });

  if (!profile) {
    return res.status(404).json({
      success: false,
      message: 'Profile not found'
    });
  }

  res.json({
    success: true,
    data: { profile }
  });
});

/**
 * @swagger
 * /api/profiles:
 *   put:
 *     summary: 프로필 수정
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 description: 전체 이름
 *               phone:
 *                 type: string
 *                 description: 전화번호
 *     responses:
 *       200:
 *         description: 프로필 수정 성공
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
 *                         profile:
 *                           $ref: '#/components/schemas/Profile'
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
const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { fullName, phone } = req.body;

  const profile = await prisma.profile.update({
    where: { id: userId },
    data: {
      fullName,
      phone
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      avatarUrl: true,
      createdAt: true
    }
  });

  res.json({
    success: true,
    data: { profile }
  });
});

// 보호된 라우트
router.post('/avatar', authenticateToken, uploadAvatar);
router.delete('/avatar', authenticateToken, deleteAvatar);
router.put('/', authenticateToken, updateProfile);

// 공개 라우트
router.get('/:id', getProfile);

module.exports = router;
