const express = require('express');
const { prisma } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validate, proposalValidation } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// 제안서 생성
const createProposal = asyncHandler(async (req, res) => {
  const {
    projectId,
    coverLetter,
    proposedRate,
    estimatedDurationWeeks,
    portfolioLinks = []
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

  // 프로젝트 존재 확인
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  if (project.status !== 'open') {
    return res.status(400).json({
      success: false,
      message: 'Project is not open for proposals'
    });
  }

  // 중복 제안서 확인
  const existingProposal = await prisma.proposal.findUnique({
    where: {
      projectId_partnerId: {
        projectId,
        partnerId: partnerProfile.id
      }
    }
  });

  if (existingProposal) {
    return res.status(400).json({
      success: false,
      message: 'Proposal already exists for this project'
    });
  }

  const proposal = await prisma.proposal.create({
    data: {
      projectId,
      partnerId: partnerProfile.id,
      coverLetter,
      proposedRate: parseFloat(proposedRate),
      estimatedDurationWeeks: estimatedDurationWeeks ? parseInt(estimatedDurationWeeks) : null,
      portfolioLinks
    },
    include: {
      project: true,
      partnerProfile: {
        include: {
          profile: true
        }
      }
    }
  });

  res.status(201).json({
    success: true,
    message: 'Proposal submitted successfully',
    data: { proposal }
  });
});

// 제안서 목록 조회 (파트너용)
const getMyProposals = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status
  } = req.query;

  const skip = (page - 1) * limit;
  const take = parseInt(limit);
  const userId = req.user.id;

  const partnerProfile = await prisma.partnerProfile.findUnique({
    where: { userId }
  });

  if (!partnerProfile) {
    return res.status(404).json({
      success: false,
      message: 'Partner profile not found'
    });
  }

  const where = { partnerId: partnerProfile.id };
  if (status) {
    where.status = status;
  }

  const [proposals, total] = await Promise.all([
    prisma.proposal.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          include: {
            projectTechStacks: {
              include: {
                techStack: true
              }
            }
          }
        }
      }
    }),
    prisma.proposal.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      proposals,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        pages: Math.ceil(total / take)
      }
    }
  });
});

// 프로젝트의 제안서 목록 조회 (클라이언트용)
const getProjectProposals = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const {
    page = 1,
    limit = 10,
    status
  } = req.query;

  const skip = (page - 1) * limit;
  const take = parseInt(limit);

  // 프로젝트 소유자 확인
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { clientId: true }
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  if (project.clientId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view proposals for this project'
    });
  }

  const where = { projectId };
  if (status) {
    where.status = status;
  }

  const [proposals, total] = await Promise.all([
    prisma.proposal.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        partnerProfile: {
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
            }
          }
        }
      }
    }),
    prisma.proposal.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      proposals,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        pages: Math.ceil(total / take)
      }
    }
  });
});

// 제안서 상세 조회
const getProposal = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const proposal = await prisma.proposal.findUnique({
    where: { id },
    include: {
      project: {
        include: {
          projectTechStacks: {
            include: {
              techStack: true
            }
          }
        }
      },
      partnerProfile: {
        include: {
          profile: true,
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

  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  // 권한 확인
  const isOwner = proposal.partnerProfile.userId === req.user.id;
  const isProjectOwner = proposal.project.clientId === req.user.id;

  if (!isOwner && !isProjectOwner) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this proposal'
    });
  }

  res.json({
    success: true,
    data: { proposal }
  });
});

// 제안서 상태 업데이트 (클라이언트용)
const updateProposalStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const proposal = await prisma.proposal.findUnique({
    where: { id },
    include: {
      project: true
    }
  });

  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  // 프로젝트 소유자 확인
  if (proposal.project.clientId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this proposal'
    });
  }

  const updatedProposal = await prisma.proposal.update({
    where: { id },
    data: { status },
    include: {
      project: true,
      partnerProfile: {
        include: {
          profile: true
        }
      }
    }
  });

  res.json({
    success: true,
    message: 'Proposal status updated successfully',
    data: { proposal: updatedProposal }
  });
});

// 제안서 수정 (파트너용)
const updateProposal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const userId = req.user.id;

  const proposal = await prisma.proposal.findFirst({
    where: {
      id,
      partnerProfile: { userId }
    }
  });

  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  if (proposal.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Cannot update proposal that is not pending'
    });
  }

  const updatedProposal = await prisma.proposal.update({
    where: { id },
    data: {
      ...updateData,
      proposedRate: updateData.proposedRate ? parseFloat(updateData.proposedRate) : undefined,
      estimatedDurationWeeks: updateData.estimatedDurationWeeks ? parseInt(updateData.estimatedDurationWeeks) : undefined
    }
  });

  res.json({
    success: true,
    message: 'Proposal updated successfully',
    data: { proposal: updatedProposal }
  });
});

// 제안서 삭제 (파트너용)
const deleteProposal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const proposal = await prisma.proposal.findFirst({
    where: {
      id,
      partnerProfile: { userId }
    }
  });

  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  if (proposal.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete proposal that is not pending'
    });
  }

  await prisma.proposal.delete({
    where: { id }
  });

  res.json({
    success: true,
    message: 'Proposal deleted successfully'
  });
});

// 보호된 라우트
router.post('/', authenticateToken, requireRole('partner'), validate(proposalValidation.create), createProposal);
router.get('/my', authenticateToken, requireRole('partner'), getMyProposals);
router.get('/project/:projectId', authenticateToken, requireRole('client'), getProjectProposals);
router.get('/:id', authenticateToken, getProposal);
router.put('/:id/status', authenticateToken, requireRole('client'), updateProposalStatus);
router.put('/:id', authenticateToken, requireRole('partner'), validate(proposalValidation.update), updateProposal);
router.delete('/:id', authenticateToken, requireRole('partner'), deleteProposal);

module.exports = router;
