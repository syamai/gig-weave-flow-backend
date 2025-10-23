const express = require('express');
const { prisma } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @swagger
 * /api/users/profile/{id}:
 *   get:
 *     summary: 사용자 프로필 조회
 *     tags: [Users]
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
 *         description: 사용자 프로필 조회 성공
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
 *                         user:
 *                           allOf:
 *                             - $ref: '#/components/schemas/User'
 *                             - type: object
 *                               properties:
 *                                 partnerProfile:
 *                                   $ref: '#/components/schemas/PartnerProfile'
 *       404:
 *         description: 사용자를 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// 프로필 조회
const getProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.profile.findUnique({
    where: { id },
    include: {
      userRole: true,
      partnerProfile: {
        include: {
          partnerTechStacks: {
            include: {
              techStack: true
            }
          },
          portfolios: true
        }
      }
    }
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    data: { user }
  });
});

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: 프로필 수정
 *     tags: [Users]
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
 *                 example: 홍길동
 *               phone:
 *                 type: string
 *                 example: 010-1234-5678
 *               avatarUrl:
 *                 type: string
 *                 format: uri
 *                 example: https://example.com/avatar.jpg
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
 *                         user:
 *                           $ref: '#/components/schemas/User'
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
// 프로필 업데이트
const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, phone, avatarUrl } = req.body;
  const userId = req.user.id;

  const user = await prisma.profile.update({
    where: { id: userId },
    data: {
      fullName,
      phone,
      avatarUrl
    }
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user }
  });
});

/**
 * @swagger
 * /api/users/stats:
 *   get:
 *     summary: 사용자 통계 조회
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 사용자 통계 조회 성공
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
 *                         stats:
 *                           type: object
 *                           properties:
 *                             totalProjects:
 *                               type: integer
 *                               description: 총 프로젝트 수
 *                             inProgress:
 *                               type: integer
 *                               description: 진행 중인 프로젝트 수
 *                             completed:
 *                               type: integer
 *                               description: 완료된 프로젝트 수
 *                             totalSpent:
 *                               type: number
 *                               description: 총 지출 금액 (클라이언트)
 *                             totalEarnings:
 *                               type: number
 *                               description: 총 수익 금액 (파트너)
 *                             pendingProposals:
 *                               type: integer
 *                               description: 대기 중인 제안서 수 (파트너)
 *       401:
 *         description: 인증 필요
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// 사용자 통계 조회
const getUserStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  let stats = {};

  if (userRole === 'client') {
    // 클라이언트 통계
    const [totalProjects, inProgress, completed, totalSpent] = await Promise.all([
      prisma.project.count({ where: { clientId: userId } }),
      prisma.project.count({ where: { clientId: userId, status: 'in_progress' } }),
      prisma.project.count({ where: { clientId: userId, status: 'completed' } }),
      prisma.contract.aggregate({
        where: {
          project: { clientId: userId }
        },
        _sum: { agreedRate: true }
      })
    ]);

    stats = {
      totalProjects,
      inProgress,
      completed,
      totalSpent: totalSpent._sum.agreedRate || 0,
      totalEarnings: 0,
      pendingProposals: 0
    };
  } else if (userRole === 'partner') {
    // 파트너 통계
    const partnerProfile = await prisma.partnerProfile.findUnique({
      where: { userId }
    });

    if (partnerProfile) {
      const [totalProposals, inProgress, completed, totalEarnings, pendingProposals] = await Promise.all([
        prisma.proposal.count({ where: { partnerId: partnerProfile.id } }),
        prisma.contract.count({ where: { partnerId: partnerProfile.id, status: 'active' } }),
        prisma.contract.count({ where: { partnerId: partnerProfile.id, status: 'completed' } }),
        prisma.contract.aggregate({
          where: { partnerId: partnerProfile.id },
          _sum: { agreedRate: true }
        }),
        prisma.proposal.count({ where: { partnerId: partnerProfile.id, status: 'pending' } })
      ]);

      stats = {
        totalProjects: totalProposals,
        inProgress,
        completed,
        totalEarnings: totalEarnings._sum.agreedRate || 0,
        totalSpent: 0,
        pendingProposals
      };
    }
  }

  res.json({
    success: true,
    data: { stats }
  });
});

router.get('/profile/:id', getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.get('/stats', authenticateToken, getUserStats);

module.exports = router;
