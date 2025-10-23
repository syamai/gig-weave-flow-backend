const express = require('express');
const { prisma } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

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
  const userRole = await prisma.userRole.findFirst({
    where: { userId: currentUserId },
    select: { role: true }
  });

  if (!userRole) {
    return res.status(404).json({
      success: false,
      message: 'User role not found'
    });
  }

  let analyticsData = {};

  if (userRole.role === 'client') {
    analyticsData = await getClientDashboard(currentUserId);
  } else if (userRole.role === 'partner') {
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
  const projects = await prisma.project.findMany({
    where: { clientId: userId },
    select: { id: true, status: true }
  });

  const projectIds = projects.map(p => p.id);
  let totalSpent = 0;
  let activeContracts = 0;
  let completedContracts = 0;

  if (projectIds.length > 0) {
    const contracts = await prisma.contract.findMany({
      where: { projectId: { in: projectIds } },
      select: { agreedRate: true, status: true }
    });

    totalSpent = contracts.reduce((sum, c) => sum + Number(c.agreedRate), 0);
    activeContracts = contracts.filter(c => c.status === 'active').length;
    completedContracts = contracts.filter(c => c.status === 'completed').length;
  }

  const proposals = await prisma.proposal.findMany({
    where: { projectId: { in: projectIds } },
    select: { id: true, status: true }
  });

  const pendingProposals = proposals.filter(p => p.status === 'pending').length;

  return {
    totalProjects: projects.length,
    openProjects: projects.filter(p => p.status === 'open').length,
    inProgressProjects: projects.filter(p => p.status === 'in_progress').length,
    completedProjects: projects.filter(p => p.status === 'completed').length,
    totalSpent,
    activeContracts,
    completedContracts,
    pendingProposals,
    avgResponseTimeHours: 0 // TODO: 계산 로직 추가
  };
}

async function getPartnerDashboard(userId) {
  const partnerProfile = await prisma.partnerProfile.findFirst({
    where: { userId },
    select: { id: true }
  });

  if (!partnerProfile) {
    throw new Error('Partner profile not found');
  }

  const proposals = await prisma.proposal.findMany({
    where: { partnerId: partnerProfile.id },
    select: { id: true, status: true, proposedRate: true }
  });

  const contracts = await prisma.contract.findMany({
    where: { partnerId: partnerProfile.id },
    select: { agreedRate: true, status: true, createdAt: true }
  });

  const reviews = await prisma.review.findMany({
    where: { revieweeId: userId },
    select: { rating: true }
  });

  const totalProposals = proposals.length;
  const pendingProposals = proposals.filter(p => p.status === 'pending').length;
  const acceptedProposals = proposals.filter(p => p.status === 'accepted').length;
  const acceptanceRate = totalProposals > 0 ? (acceptedProposals / totalProposals) * 100 : 0;

  const activeContracts = contracts.filter(c => c.status === 'active').length;
  const completedContracts = contracts.filter(c => c.status === 'completed').length;
  const totalEarnings = contracts.reduce((sum, c) => sum + Number(c.agreedRate), 0);

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return {
    totalProposals,
    pendingProposals,
    acceptedProposals,
    acceptanceRate: Math.round(acceptanceRate * 10) / 10,
    activeContracts,
    completedContracts,
    totalEarnings,
    avgRating: Math.round(avgRating * 10) / 10,
    totalReviews: reviews.length,
    monthlyEarnings: [] // TODO: 월별 수익 계산 로직 추가
  };
}

async function getPartnerPerformanceData(partnerId, startDate, endDate) {
  let contractQuery = {
    partnerId
  };

  if (startDate) {
    contractQuery.createdAt = { gte: new Date(startDate) };
  }
  if (endDate) {
    contractQuery.createdAt = { 
      ...contractQuery.createdAt,
      lte: new Date(endDate)
    };
  }

  const contracts = await prisma.contract.findMany({
    where: contractQuery,
    select: {
      agreedRate: true,
      status: true,
      createdAt: true,
      startDate: true,
      endDate: true
    }
  });

  const totalContracts = contracts.length;
  const completedContracts = contracts.filter(c => c.status === 'completed').length;
  const activeContracts = contracts.filter(c => c.status === 'active').length;
  const totalRevenue = contracts.reduce((sum, c) => sum + Number(c.agreedRate), 0);

  let avgDurationDays = 0;
  const completedWithDates = contracts.filter(c => 
    c.status === 'completed' && c.startDate && c.endDate
  );

  if (completedWithDates.length > 0) {
    const durations = completedWithDates.map(c => {
      const start = new Date(c.startDate);
      const end = new Date(c.endDate);
      return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    });
    avgDurationDays = durations.reduce((sum, d) => sum + d, 0) / durations.length;
  }

  const reviews = await prisma.review.findMany({
    where: { revieweeId: partnerId },
    select: { rating: true }
  });

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const ratingDistribution = {
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating === 4).length,
    3: reviews.filter(r => r.rating === 3).length,
    2: reviews.filter(r => r.rating === 2).length,
    1: reviews.filter(r => r.rating === 1).length
  };

  return {
    totalContracts,
    completedContracts,
    activeContracts,
    completionRate: totalContracts > 0 ? (completedContracts / totalContracts) * 100 : 0,
    totalRevenue,
    avgContractValue: totalContracts > 0 ? totalRevenue / totalContracts : 0,
    avgDurationDays: Math.round(avgDurationDays * 10) / 10,
    avgRating: Math.round(avgRating * 10) / 10,
    totalReviews: reviews.length,
    ratingDistribution
  };
}

async function getClientActivityData(clientId, startDate, endDate) {
  let projectQuery = { clientId };

  if (startDate) {
    projectQuery.createdAt = { gte: new Date(startDate) };
  }
  if (endDate) {
    projectQuery.createdAt = { 
      ...projectQuery.createdAt,
      lte: new Date(endDate)
    };
  }

  const projects = await prisma.project.findMany({
    where: projectQuery,
    select: { id: true, status: true, budgetMin: true, budgetMax: true }
  });

  const projectIds = projects.map(p => p.id);
  let totalSpent = 0;
  let contracts = [];

  if (projectIds.length > 0) {
    contracts = await prisma.contract.findMany({
      where: { projectId: { in: projectIds } },
      select: { agreedRate: true, status: true }
    });

    totalSpent = contracts.reduce((sum, c) => sum + Number(c.agreedRate), 0);
  }

  const proposals = await prisma.proposal.findMany({
    where: { projectId: { in: projectIds } },
    select: { id: true, projectId: true }
  });

  const reviews = await prisma.review.findMany({
    where: { reviewerId: clientId },
    select: { rating: true }
  });

  const projectsByStatus = {
    open: projects.filter(p => p.status === 'open').length,
    in_progress: projects.filter(p => p.status === 'in_progress').length,
    completed: projects.filter(p => p.status === 'completed').length,
    cancelled: projects.filter(p => p.status === 'cancelled').length
  };

  const avgBudget = projects.length > 0 ? totalSpent / projects.length : 0;
  const avgProposalsPerProject = projects.length > 0 ? proposals.length / projects.length : 0;

  const avgRatingGiven = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return {
    totalProjects: projects.length,
    projectsByStatus,
    totalSpent,
    avgBudget,
    totalContracts: contracts.length,
    totalProposals: proposals.length,
    avgProposalsPerProject: Math.round(avgProposalsPerProject * 10) / 10,
    reviewsWritten: reviews.length,
    avgRatingGiven: Math.round(avgRatingGiven * 10) / 10
  };
}

async function getTrendsData(startDate, endDate) {
  let projectQuery = {};
  let proposalQuery = {};
  let contractQuery = {};

  if (startDate) {
    const start = new Date(startDate);
    projectQuery.createdAt = { gte: start };
    proposalQuery.createdAt = { gte: start };
    contractQuery.createdAt = { gte: start };
  }
  if (endDate) {
    const end = new Date(endDate);
    projectQuery.createdAt = { 
      ...projectQuery.createdAt,
      lte: end
    };
    proposalQuery.createdAt = { 
      ...proposalQuery.createdAt,
      lte: end
    };
    contractQuery.createdAt = { 
      ...contractQuery.createdAt,
      lte: end
    };
  }

  const [projects, proposals, contracts] = await Promise.all([
    prisma.project.findMany({
      where: projectQuery,
      select: { createdAt: true, projectType: true, status: true }
    }),
    prisma.proposal.findMany({
      where: proposalQuery,
      select: { createdAt: true, status: true }
    }),
    prisma.contract.findMany({
      where: contractQuery,
      select: { createdAt: true, agreedRate: true, status: true }
    })
  ]);

  // 월별 트렌드 계산
  const monthlyTrends = [];
  const now = endDate ? new Date(endDate) : new Date();
  const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth() - 5, 1);
  
  let currentDate = new Date(start.getFullYear(), start.getMonth(), 1);
  
  while (currentDate <= now) {
    const nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    
    const monthProjects = projects.filter(p => {
      const createdAt = new Date(p.createdAt);
      return createdAt >= currentDate && createdAt < nextDate;
    });
    
    const monthProposals = proposals.filter(p => {
      const createdAt = new Date(p.createdAt);
      return createdAt >= currentDate && createdAt < nextDate;
    });
    
    const monthContracts = contracts.filter(c => {
      const createdAt = new Date(c.createdAt);
      return createdAt >= currentDate && createdAt < nextDate;
    });
    
    monthlyTrends.push({
      month: currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short' }),
      projects: monthProjects.length,
      proposals: monthProposals.length,
      contracts: monthContracts.length,
      revenue: monthContracts.reduce((sum, c) => sum + Number(c.agreedRate), 0)
    });
    
    currentDate = nextDate;
  }

  const projectTypeDistribution = {
    fixed: projects.filter(p => p.projectType === 'fixed').length,
    hourly: projects.filter(p => p.projectType === 'hourly').length
  };

  const totalRevenue = contracts.reduce((sum, c) => sum + Number(c.agreedRate), 0);
  const avgContractValue = contracts.length > 0 ? totalRevenue / contracts.length : 0;
  
  const proposalAcceptanceRate = proposals.length > 0
    ? (proposals.filter(p => p.status === 'accepted').length / proposals.length) * 100
    : 0;

  return {
    monthlyTrends,
    projectTypeDistribution,
    totalProjects: projects.length,
    totalProposals: proposals.length,
    totalContracts: contracts.length,
    totalRevenue,
    avgContractValue: Math.round(avgContractValue),
    proposalAcceptanceRate: Math.round(proposalAcceptanceRate * 10) / 10
  };
}

// 보호된 라우트
router.post('/dashboard', authenticateToken, getDashboardAnalytics);
router.post('/partner-performance', authenticateToken, getPartnerPerformance);
router.post('/client-activity', authenticateToken, getClientActivity);
router.post('/trends', authenticateToken, getTrends);

module.exports = router;
