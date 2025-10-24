const express = require('express');
const { supabase } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validate, reviewValidation } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

// 임시로 Prisma 사용 비활성화
const prisma = null;

const router = express.Router();

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: 리뷰 작성
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contractId
 *               - revieweeId
 *               - rating
 *             properties:
 *               contractId:
 *                 type: string
 *                 format: uuid
 *                 description: 계약 ID
 *               revieweeId:
 *                 type: string
 *                 format: uuid
 *                 description: 리뷰 대상자 ID
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: 평점 (1-5)
 *               comment:
 *                 type: string
 *                 maxLength: 1000
 *                 description: 리뷰 내용
 *     responses:
 *       201:
 *         description: 리뷰 작성 성공
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
 *                         review:
 *                           $ref: '#/components/schemas/Review'
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
 *       403:
 *         description: 권한 없음 (계약 당사자만 가능)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
const createReview = asyncHandler(async (req, res) => {
  const { contractId, revieweeId, rating, comment } = req.body;
  const reviewerId = req.user.id;

  // 계약 존재 및 완료 상태 확인
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      project: true,
      partnerProfile: true
    }
  });

  if (!contract) {
    return res.status(404).json({
      success: false,
      message: 'Contract not found'
    });
  }

  if (contract.status !== 'completed') {
    return res.status(400).json({
      success: false,
      message: 'Can only review completed contracts'
    });
  }

  // 계약 당사자인지 확인
  const isClient = contract.project.clientId === reviewerId;
  const isPartner = contract.partnerProfile.userId === reviewerId;

  if (!isClient && !isPartner) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to review this contract'
    });
  }

  // 리뷰 대상자 확인
  const expectedRevieweeId = isClient ? contract.partnerProfile.userId : contract.project.clientId;
  if (revieweeId !== expectedRevieweeId) {
    return res.status(400).json({
      success: false,
      message: 'Invalid reviewee ID'
    });
  }

  // 중복 리뷰 확인
  const existingReview = await prisma.review.findFirst({
    where: {
      contractId,
      reviewerId
    }
  });

  if (existingReview) {
    return res.status(400).json({
      success: false,
      message: 'Review already exists for this contract'
    });
  }

  const review = await prisma.review.create({
    data: {
      contractId,
      reviewerId,
      revieweeId,
      rating,
      comment
    },
    include: {
      reviewer: {
        select: {
          id: true,
          fullName: true,
          avatarUrl: true
        }
      }
    }
  });

  res.status(201).json({
    success: true,
    message: 'Review created successfully',
    data: { review }
  });
});

/**
 * @swagger
 * /api/reviews/{id}:
 *   put:
 *     summary: 리뷰 수정
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 리뷰 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: 리뷰 수정 성공
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
 *                         review:
 *                           $ref: '#/components/schemas/Review'
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
 *       403:
 *         description: 권한 없음 (리뷰 작성자만 가능)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: 리뷰를 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
const updateReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user.id;

  const review = await prisma.review.findFirst({
    where: {
      id,
      reviewerId: userId
    }
  });

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  const updatedReview = await prisma.review.update({
    where: { id },
    data: {
      rating,
      comment
    },
    include: {
      reviewer: {
        select: {
          id: true,
          fullName: true,
          avatarUrl: true
        }
      }
    }
  });

  res.json({
    success: true,
    message: 'Review updated successfully',
    data: { review: updatedReview }
  });
});

/**
 * @swagger
 * /api/reviews/{id}:
 *   delete:
 *     summary: 리뷰 삭제
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 리뷰 ID
 *     responses:
 *       200:
 *         description: 리뷰 삭제 성공
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
 *       403:
 *         description: 권한 없음 (리뷰 작성자만 가능)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: 리뷰를 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const review = await prisma.review.findFirst({
    where: {
      id,
      reviewerId: userId
    }
  });

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  await prisma.review.delete({
    where: { id }
  });

  res.json({
    success: true,
    message: 'Review deleted successfully'
  });
});

/**
 * @swagger
 * /api/reviews/user/{userId}:
 *   get:
 *     summary: 사용자 리뷰 목록 조회
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 사용자 ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 페이지당 항목 수
 *     responses:
 *       200:
 *         description: 리뷰 목록 조회 성공
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
 *                         reviews:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Review'
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             page:
 *                               type: integer
 *                             limit:
 *                               type: integer
 *                             total:
 *                               type: integer
 *                             pages:
 *                               type: integer
 *                         averageRating:
 *                           type: number
 *                           description: 평균 평점
 *                         totalReviews:
 *                           type: integer
 *                           description: 총 리뷰 수
 */
const getUserReviews = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const skip = (page - 1) * limit;
  const take = parseInt(limit);

  const [reviews, total, avgRating] = await Promise.all([
    prisma.review.findMany({
      where: { revieweeId: userId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        reviewer: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true
          }
        },
        contract: {
          include: {
            project: {
              select: {
                title: true
              }
            }
          }
        }
      }
    }),
    prisma.review.count({
      where: { revieweeId: userId }
    }),
    prisma.review.aggregate({
      where: { revieweeId: userId },
      _avg: { rating: true }
    })
  ]);

  res.json({
    success: true,
    data: {
      reviews,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        pages: Math.ceil(total / take)
      },
      averageRating: avgRating._avg.rating || 0,
      totalReviews: total
    }
  });
});

/**
 * @swagger
 * /api/reviews/contract/{contractId}:
 *   get:
 *     summary: 계약별 리뷰 조회
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: contractId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 계약 ID
 *     responses:
 *       200:
 *         description: 계약 리뷰 조회 성공
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
 *                         reviews:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Review'
 *       404:
 *         description: 계약을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
const getContractReviews = asyncHandler(async (req, res) => {
  const { contractId } = req.params;

  const contract = await prisma.contract.findUnique({
    where: { id: contractId }
  });

  if (!contract) {
    return res.status(404).json({
      success: false,
      message: 'Contract not found'
    });
  }

  const reviews = await prisma.review.findMany({
    where: { contractId },
    include: {
      reviewer: {
        select: {
          id: true,
          fullName: true,
          avatarUrl: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({
    success: true,
    data: { reviews }
  });
});

// 보호된 라우트
router.post('/', authenticateToken, validate(reviewValidation.create), createReview);
router.put('/:id', authenticateToken, validate(reviewValidation.update), updateReview);
router.delete('/:id', authenticateToken, deleteReview);

// 공개 라우트
router.get('/user/:userId', getUserReviews);
router.get('/contract/:contractId', getContractReviews);

module.exports = router;
