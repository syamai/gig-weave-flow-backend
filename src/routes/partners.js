const express = require('express');
const { prisma } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validate, partnerProfileValidation } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// 파트너 목록 조회
const getPartners = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    techStackIds,
    experienceMin,
    hourlyRateMax,
    available
  } = req.query;

  const skip = (page - 1) * limit;
  const take = parseInt(limit);

  const where = {
    available: available === 'true' ? true : undefined
  };

  // 검색 조건
  if (search) {
    where.OR = [
      { bio: { contains: search, mode: 'insensitive' } }
    ];
  }

  // 경력 필터
  if (experienceMin) {
    where.experienceYears = { gte: parseInt(experienceMin) };
  }

  // 시간당 요금 필터
  if (hourlyRateMax) {
    where.hourlyRate = { lte: parseFloat(hourlyRateMax) };
  }

  // 기술 스택 필터
  if (techStackIds) {
    const techStackArray = techStackIds.split(',');
    where.partnerTechStacks = {
      some: {
        techStackId: { in: techStackArray }
      }
    };
  }

  const [partners, total] = await Promise.all([
    prisma.partnerProfile.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        profile: true,
        partnerTechStacks: {
          include: {
            techStack: true
          }
        },
        portfolios: {
          take: 3,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            proposals: true,
            contracts: true
          }
        }
      }
    }),
    prisma.partnerProfile.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      partners,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        pages: Math.ceil(total / take)
      }
    }
  });
});

// 파트너 상세 조회
const getPartner = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const partner = await prisma.partnerProfile.findUnique({
    where: { id },
    include: {
      profile: true,
      partnerTechStacks: {
        include: {
          techStack: true
        }
      },
      portfolios: {
        orderBy: { createdAt: 'desc' }
      },
      contracts: {
        where: { status: 'completed' },
        include: {
          project: true
        }
      },
      _count: {
        select: {
          proposals: true,
          contracts: true
        }
      }
    }
  });

  if (!partner) {
    return res.status(404).json({
      success: false,
      message: 'Partner not found'
    });
  }

  res.json({
    success: true,
    data: { partner }
  });
});

// 파트너 프로필 생성/수정
const upsertPartnerProfile = asyncHandler(async (req, res) => {
  const {
    bio,
    experienceYears,
    hourlyRate,
    projectRate,
    available,
    techStackIds = []
  } = req.body;

  const userId = req.user.id;

  const result = await prisma.$transaction(async (tx) => {
    // 파트너 프로필 생성 또는 업데이트
    const partnerProfile = await tx.partnerProfile.upsert({
      where: { userId },
      update: {
        bio,
        experienceYears: experienceYears ? parseInt(experienceYears) : null,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        projectRate: projectRate ? parseFloat(projectRate) : null,
        available: available !== undefined ? available : true
      },
      create: {
        userId,
        bio,
        experienceYears: experienceYears ? parseInt(experienceYears) : null,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        projectRate: projectRate ? parseFloat(projectRate) : null,
        available: available !== undefined ? available : true
      }
    });

    // 기술 스택 업데이트
    if (techStackIds.length >= 0) {
      // 기존 기술 스택 삭제
      await tx.partnerTechStack.deleteMany({
        where: { partnerId: partnerProfile.id }
      });

      // 새 기술 스택 추가
      if (techStackIds.length > 0) {
        await tx.partnerTechStack.createMany({
          data: techStackIds.map(techStackId => ({
            partnerId: partnerProfile.id,
            techStackId
          }))
        });
      }
    }

    return partnerProfile;
  });

  res.json({
    success: true,
    message: 'Partner profile saved successfully',
    data: { partnerProfile: result }
  });
});

// 내 파트너 프로필 조회
const getMyPartnerProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const partnerProfile = await prisma.partnerProfile.findUnique({
    where: { userId },
    include: {
      profile: true,
      partnerTechStacks: {
        include: {
          techStack: true
        }
      },
      portfolios: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!partnerProfile) {
    return res.status(404).json({
      success: false,
      message: 'Partner profile not found'
    });
  }

  res.json({
    success: true,
    data: { partnerProfile }
  });
});

// 포트폴리오 생성
const createPortfolio = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    techUsed,
    projectUrl,
    imageUrls = []
  } = req.body;

  const userId = req.user.id;

  // 파트너 프로필 확인
  const partnerProfile = await prisma.partnerProfile.findUnique({
    where: { userId }
  });

  if (!partnerProfile) {
    return res.status(404).json({
      success: false,
      message: 'Partner profile not found'
    });
  }

  const portfolio = await prisma.portfolio.create({
    data: {
      partnerId: partnerProfile.id,
      title,
      description,
      techUsed,
      projectUrl,
      imageUrls
    }
  });

  res.status(201).json({
    success: true,
    message: 'Portfolio created successfully',
    data: { portfolio }
  });
});

// 포트폴리오 수정
const updatePortfolio = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const userId = req.user.id;

  // 포트폴리오 소유자 확인
  const portfolio = await prisma.portfolio.findFirst({
    where: {
      id,
      partnerProfile: { userId }
    }
  });

  if (!portfolio) {
    return res.status(404).json({
      success: false,
      message: 'Portfolio not found'
    });
  }

  const updatedPortfolio = await prisma.portfolio.update({
    where: { id },
    data: updateData
  });

  res.json({
    success: true,
    message: 'Portfolio updated successfully',
    data: { portfolio: updatedPortfolio }
  });
});

// 포트폴리오 삭제
const deletePortfolio = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // 포트폴리오 소유자 확인
  const portfolio = await prisma.portfolio.findFirst({
    where: {
      id,
      partnerProfile: { userId }
    }
  });

  if (!portfolio) {
    return res.status(404).json({
      success: false,
      message: 'Portfolio not found'
    });
  }

  await prisma.portfolio.delete({
    where: { id }
  });

  res.json({
    success: true,
    message: 'Portfolio deleted successfully'
  });
});

// 공개 라우트
router.get('/', getPartners);
router.get('/:id', getPartner);

// 보호된 라우트
router.post('/profile', authenticateToken, requireRole('partner'), validate(partnerProfileValidation.create), upsertPartnerProfile);
router.get('/profile/me', authenticateToken, requireRole('partner'), getMyPartnerProfile);
router.post('/portfolios', authenticateToken, requireRole('partner'), createPortfolio);
router.put('/portfolios/:id', authenticateToken, requireRole('partner'), updatePortfolio);
router.delete('/portfolios/:id', authenticateToken, requireRole('partner'), deletePortfolio);

module.exports = router;
