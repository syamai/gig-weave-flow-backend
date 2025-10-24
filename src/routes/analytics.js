const express = require('express');
const { supabase } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// Supabase 사용

const router = express.Router();

/**
 * @swagger
 * /api/analytics/dashboard:
 *   post:
 *     summary: 대시보드 분석 데이터 조회
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 description: "사용자 ID (선택사항, 기본값: 현재 사용자)"
 *     responses:
 *       200:
 *         description: 대시보드 분석 데이터 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       description: 역할별 대시보드 데이터
 */
const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const currentUserId = userId || req.user.id;

  // 사용자 역할 확인
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', currentUserId)
    .single();

  if (userError || !user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  let analyticsData = {};

  if (user.role === 'CLIENT') {
    analyticsData = await getClientDashboard(currentUserId);
  } else if (user.role === 'PARTNER') {
    analyticsData = await getPartnerDashboard(currentUserId);
  } else {
    return res.status(400).json({
      success: false,
      message: 'Invalid user role for analytics'
    });
  }

  res.json({
    success: true,
    data: analyticsData
  });
});

/**
 * @swagger
 * /api/analytics/partner-performance:
 *   post:
 *     summary: 파트너 성과 분석 데이터 조회
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               partnerId:
 *                 type: string
 *                 format: uuid
 *                 description: 파트너 ID
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: 시작 날짜
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: 종료 날짜
 *     responses:
 *       200:
 *         description: 파트너 성과 분석 데이터 조회 성공
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
 *                         totalContracts:
 *                           type: integer
 *                         completedContracts:
 *                           type: integer
 *                         completionRate:
 *                           type: number
 *                         totalRevenue:
 *                           type: number
 *                         avgContractValue:
 *                           type: number
 *                         avgDurationDays:
 *                           type: number
 *                         avgRating:
 *                           type: number
 *                         totalReviews:
 *                           type: integer
 *                         ratingDistribution:
 *                           type: object
 */
const getPartnerPerformance = asyncHandler(async (req, res) => {
  const { partnerId, startDate, endDate } = req.body;

  const partnerProfile = await prisma.partnerProfile.findFirst({
    where: { userId: partnerId },
    select: { id: true }
  });

  if (!partnerProfile) {
    return res.status(404).json({
      success: false,
      message: 'Partner profile not found'
    });
  }

  const analyticsData = await getPartnerPerformanceData(partnerProfile.id, startDate, endDate);

  res.json({
    success: true,
    data: analyticsData
  });
});

/**
 * @swagger
 * /api/analytics/client-activity:
 *   post:
 *     summary: 클라이언트 활동 분석 데이터 조회
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               clientId:
 *                 type: string
 *                 format: uuid
 *                 description: 클라이언트 ID
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: 시작 날짜
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: 종료 날짜
 *     responses:
 *       200:
 *         description: 클라이언트 활동 분석 데이터 조회 성공
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
 *                         totalProjects:
 *                           type: integer
 *                         projectsByStatus:
 *                           type: object
 *                         totalSpent:
 *                           type: number
 *                         avgBudget:
 *                           type: number
 *                         totalContracts:
 *                           type: integer
 *                         totalProposals:
 *                           type: integer
 *                         avgProposalsPerProject:
 *                           type: number
 *                         reviewsWritten:
 *                           type: integer
 *                         avgRatingGiven:
 *                           type: number
 */
const getClientActivity = asyncHandler(async (req, res) => {
  const { clientId, startDate, endDate } = req.body;

  const analyticsData = await getClientActivityData(clientId, startDate, endDate);

  res.json({
    success: true,
    data: analyticsData
  });
});

/**
 * @swagger
 * /api/analytics/trends:
 *   post:
 *     summary: 플랫폼 트렌드 분석 데이터 조회
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: 시작 날짜
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: 종료 날짜
 *     responses:
 *       200:
 *         description: 트렌드 분석 데이터 조회 성공
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
 *                         monthlyTrends:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               month:
 *                                 type: string
 *                               projects:
 *                                 type: integer
 *                               proposals:
 *                                 type: integer
 *                               contracts:
 *                                 type: integer
 *                               revenue:
 *                                 type: number
 *                         projectTypeDistribution:
 *                           type: object
 *                         totalProjects:
 *                           type: integer
 *                         totalProposals:
 *                           type: integer
 *                         totalContracts:
 *                           type: integer
 *                         totalRevenue:
 *                           type: number
 *                         avgContractValue:
 *                           type: number
 *                         proposalAcceptanceRate:
 *                           type: number
 */
const getTrends = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.body;

  const analyticsData = await getTrendsData(startDate, endDate);

  res.json({
    success: true,
    data: analyticsData
  });
});

// 헬퍼 함수들
async function getClientDashboard(userId) {
  // 프로젝트 조회
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, status')
    .eq('client_id', userId);

  if (projectsError) {
    throw projectsError;
  }

  const projectIds = projects ? projects.map(p => p.id) : [];
  let totalSpent = 0;
  let activeContracts = 0;
  let completedContracts = 0;

  if (projectIds.length > 0) {
    const { data: contracts, error: contractsError } = await supabase
      .from('contracts')
      .select('agreed_rate, status')
      .in('project_id', projectIds);

    if (contractsError) {
      throw contractsError;
    }

    totalSpent = contracts ? contracts.reduce((sum, c) => sum + Number(c.agreed_rate || 0), 0) : 0;
    activeContracts = contracts ? contracts.filter(c => c.status === 'active').length : 0;
    completedContracts = contracts ? contracts.filter(c => c.status === 'completed').length : 0;
  }

  const { data: proposals, error: proposalsError } = await supabase
    .from('proposals')
    .select('id, status')
    .in('project_id', projectIds);

  if (proposalsError) {
    throw proposalsError;
  }

  const pendingProposals = proposals ? proposals.filter(p => p.status === 'pending').length : 0;

  return {
    totalProjects: projects ? projects.length : 0,
    openProjects: projects ? projects.filter(p => p.status === 'open').length : 0,
    inProgressProjects: projects ? projects.filter(p => p.status === 'in_progress').length : 0,
    completedProjects: projects ? projects.filter(p => p.status === 'completed').length : 0,
    totalSpent,
    activeContracts,
    completedContracts,
    pendingProposals,
    avgResponseTimeHours: 0 // TODO: 계산 로직 추가
  };
}

async function getPartnerDashboard(userId) {
  // 임시로 기본값 반환 (나중에 완전히 구현)
  return {
    totalProposals: 0,
    pendingProposals: 0,
    acceptedProposals: 0,
    acceptanceRate: 0,
    activeContracts: 0,
    completedContracts: 0,
    totalEarnings: 0,
    avgRating: 0,
    totalReviews: 0,
    monthlyEarnings: []
  };
}

async function getPartnerPerformanceData(partnerId, startDate, endDate) {
  // 임시로 기본값 반환 (나중에 완전히 구현)
  return {
    totalContracts: 0,
    completedContracts: 0,
    activeContracts: 0,
    completionRate: 0,
    totalRevenue: 0,
    avgContractValue: 0,
    avgDurationDays: 0,
    avgRating: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  };
}

async function getClientActivityData(clientId, startDate, endDate) {
  // 임시로 기본값 반환 (나중에 완전히 구현)
  return {
    totalProjects: 0,
    projectsByStatus: { open: 0, in_progress: 0, completed: 0, cancelled: 0 },
    totalSpent: 0,
    avgBudget: 0,
    totalContracts: 0,
    totalProposals: 0,
    avgProposalsPerProject: 0,
    reviewsWritten: 0,
    avgRatingGiven: 0
  };
}

async function getTrendsData(startDate, endDate) {
  // 임시로 기본값 반환 (나중에 완전히 구현)
  return {
    monthlyTrends: [],
    projectTypeDistribution: { fixed: 0, hourly: 0 },
    totalProjects: 0,
    totalProposals: 0,
    totalContracts: 0,
    totalRevenue: 0,
    avgContractValue: 0,
    proposalAcceptanceRate: 0
  };
}

// 기본 라우트 (라우트 등록 확인용)
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Analytics API is working',
    endpoints: [
      'POST /dashboard - Get dashboard analytics (auth required)',
      'POST /partner-performance - Get partner performance (auth required)',
      'POST /client-activity - Get client activity (auth required)',
      'POST /trends - Get platform trends (auth required)'
    ]
  });
});

// 보호된 라우트
router.post('/dashboard', authenticateToken, getDashboardAnalytics);
router.post('/partner-performance', authenticateToken, getPartnerPerformance);
router.post('/client-activity', authenticateToken, getClientActivity);
router.post('/trends', authenticateToken, getTrends);

module.exports = router;
