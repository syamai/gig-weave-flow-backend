const express = require('express');
const { supabase } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validate, reviewValidation } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

// Supabase 사용

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
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select(`
      *,
      projects!contracts_project_id_fkey (
        client_id
      ),
      profiles!contracts_freelancer_id_fkey (
        user_id
      )
    `)
    .eq('id', contractId)
    .single();

  if (contractError || !contract) {
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
  const isClient = contract.projects.client_id === reviewerId;
  const isPartner = contract.profiles.user_id === reviewerId;

  if (!isClient && !isPartner) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to review this contract'
    });
  }

  // 리뷰 대상자 확인
  const expectedRevieweeId = isClient ? contract.profiles.user_id : contract.projects.client_id;
  if (revieweeId !== expectedRevieweeId) {
    return res.status(400).json({
      success: false,
      message: 'Invalid reviewee ID'
    });
  }

  // 중복 리뷰 확인
  const { data: existingReview } = await supabase
    .from('reviews')
    .select('id')
    .eq('contract_id', contractId)
    .eq('reviewer_id', reviewerId)
    .single();

  if (existingReview) {
    return res.status(400).json({
      success: false,
      message: 'Review already exists for this contract'
    });
  }

  // 리뷰 생성
  const { data: review, error: reviewError } = await supabase
    .from('reviews')
    .insert({
      contract_id: contractId,
      reviewer_id: reviewerId,
      reviewee_id: revieweeId,
      rating,
      comment
    })
    .select(`
      *,
      profiles!reviews_reviewer_id_fkey (
        id,
        full_name,
        avatar_url
      )
    `)
    .single();

  if (reviewError) {
    throw reviewError;
  }

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

  // 리뷰 존재 및 권한 확인
  const { data: review, error: findError } = await supabase
    .from('reviews')
    .select('id')
    .eq('id', id)
    .eq('reviewer_id', userId)
    .single();

  if (findError || !review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  // 리뷰 업데이트
  const { data: updatedReview, error: updateError } = await supabase
    .from('reviews')
    .update({
      rating,
      comment
    })
    .eq('id', id)
    .select(`
      *,
      profiles!reviews_reviewer_id_fkey (
        id,
        full_name,
        avatar_url
      )
    `)
    .single();

  if (updateError) {
    throw updateError;
  }

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

  // 리뷰 존재 및 권한 확인
  const { data: review, error: findError } = await supabase
    .from('reviews')
    .select('id')
    .eq('id', id)
    .eq('reviewer_id', userId)
    .single();

  if (findError || !review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  // 리뷰 삭제
  const { error: deleteError } = await supabase
    .from('reviews')
    .delete()
    .eq('id', id);

  if (deleteError) {
    throw deleteError;
  }

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

  // 리뷰 목록 조회
  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select(`
      *,
      profiles!reviews_reviewer_id_fkey (
        id,
        full_name,
        avatar_url
      ),
      contracts!reviews_contract_id_fkey (
        projects!contracts_project_id_fkey (
          title
        )
      )
    `)
    .eq('reviewee_id', userId)
    .order('created_at', { ascending: false })
    .range(skip, skip + take - 1);

  if (reviewsError) {
    throw reviewsError;
  }

  // 총 개수 조회
  const { count: total, error: countError } = await supabase
    .from('reviews')
    .select('id', { count: 'exact' })
    .eq('reviewee_id', userId);

  if (countError) {
    throw countError;
  }

  // 평균 평점 계산
  const { data: ratingData, error: ratingError } = await supabase
    .from('reviews')
    .select('rating')
    .eq('reviewee_id', userId);

  if (ratingError) {
    throw ratingError;
  }

  const averageRating = ratingData && ratingData.length > 0
    ? ratingData.reduce((sum, r) => sum + r.rating, 0) / ratingData.length
    : 0;

  res.json({
    success: true,
    data: {
      reviews: reviews || [],
      pagination: {
        page: parseInt(page),
        limit: take,
        total: total || 0,
        pages: Math.ceil((total || 0) / take)
      },
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: total || 0
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

  // 계약 존재 확인
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select('id')
    .eq('id', contractId)
    .single();

  if (contractError || !contract) {
    return res.status(404).json({
      success: false,
      message: 'Contract not found'
    });
  }

  // 계약 리뷰 조회
  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select(`
      *,
      profiles!reviews_reviewer_id_fkey (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('contract_id', contractId)
    .order('created_at', { ascending: false });

  if (reviewsError) {
    throw reviewsError;
  }

  res.json({
    success: true,
    data: { reviews: reviews || [] }
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
