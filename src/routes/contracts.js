const express = require('express');
const { supabase } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// 계약 생성
const createContract = asyncHandler(async (req, res) => {
  const {
    projectId,
    partnerId,
    proposalId,
    agreedRate,
    startDate,
    endDate,
    terms
  } = req.body;

  const clientId = req.user.id;

  // 프로젝트 소유자 확인
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { clientId: true, status: true }
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  if (project.clientId !== clientId) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to create contract for this project'
    });
  }

  if (project.status !== 'open') {
    return res.status(400).json({
      success: false,
      message: 'Project is not open for contracts'
    });
  }

  // 제안서 확인 (선택사항)
  if (proposalId) {
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      select: { partnerId: true, status: true }
    });

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    if (proposal.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Proposal must be accepted before creating contract'
      });
    }

    if (proposal.partnerId !== partnerId) {
      return res.status(400).json({
        success: false,
        message: 'Partner ID does not match proposal'
      });
    }
  }

  const contract = await prisma.$transaction(async (tx) => {
    // 계약 생성
    const newContract = await tx.contract.create({
      data: {
        projectId,
        partnerId,
        proposalId,
        agreedRate: parseFloat(agreedRate),
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        terms,
        status: 'active'
      }
    });

    // 프로젝트 상태 업데이트
    await tx.project.update({
      where: { id: projectId },
      data: { status: 'in_progress' }
    });

    // 다른 제안서들 거부
    if (proposalId) {
      await tx.proposal.updateMany({
        where: {
          projectId,
          id: { not: proposalId },
          status: 'pending'
        },
        data: { status: 'rejected' }
      });
    }

    return newContract;
  });

  res.status(201).json({
    success: true,
    message: 'Contract created successfully',
    data: { contract }
  });
});

// 계약 목록 조회
const getContracts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status
  } = req.query;

  const skip = (page - 1) * limit;
  const take = parseInt(limit);
  const userId = req.user.id;
  const userRole = req.user.role;

  let where = {};

  if (userRole === 'client') {
    where.project = { clientId: userId };
  } else if (userRole === 'partner') {
    where.partnerProfile = { userId };
  }

  if (status) {
    where.status = status;
  }

  const [contracts, total] = await Promise.all([
    prisma.contract.findMany({
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
        },
        partnerProfile: {
          include: {
            profile: true
          }
        }
      }
    }),
    prisma.contract.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      contracts,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        pages: Math.ceil(total / take)
      }
    }
  });
});

// 계약 상세 조회
const getContract = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  const contract = await prisma.contract.findUnique({
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
          }
        }
      },
      proposal: true
    }
  });

  if (!contract) {
    return res.status(404).json({
      success: false,
      message: 'Contract not found'
    });
  }

  // 권한 확인
  const isClient = contract.project.clientId === userId;
  const isPartner = contract.partnerProfile.userId === userId;

  if (!isClient && !isPartner) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this contract'
    });
  }

  res.json({
    success: true,
    data: { contract }
  });
});

// 계약 상태 업데이트
const updateContractStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  const contract = await prisma.contract.findUnique({
    where: { id },
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

  // 권한 확인
  const isClient = contract.project.clientId === userId;
  const isPartner = contract.partnerProfile.userId === userId;

  if (!isClient && !isPartner) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this contract'
    });
  }

  const updatedContract = await prisma.$transaction(async (tx) => {
    // 계약 상태 업데이트
    const updatedContract = await tx.contract.update({
      where: { id },
      data: { status }
    });

    // 계약 완료 시 프로젝트 상태도 업데이트
    if (status === 'completed') {
      await tx.project.update({
        where: { id: contract.projectId },
        data: { status: 'completed' }
      });
    }

    return updatedContract;
  });

  res.json({
    success: true,
    message: 'Contract status updated successfully',
    data: { contract: updatedContract }
  });
});

// 계약 수정
const updateContract = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const userId = req.user.id;

  const contract = await prisma.contract.findUnique({
    where: { id },
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

  // 권한 확인 (클라이언트만 수정 가능)
  if (contract.project.clientId !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this contract'
    });
  }

  const updatedContract = await prisma.contract.update({
    where: { id },
    data: {
      ...updateData,
      agreedRate: updateData.agreedRate ? parseFloat(updateData.agreedRate) : undefined,
      startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
      endDate: updateData.endDate ? new Date(updateData.endDate) : undefined
    }
  });

  res.json({
    success: true,
    message: 'Contract updated successfully',
    data: { contract: updatedContract }
  });
});

// 보호된 라우트
router.post('/', authenticateToken, requireRole('client'), createContract);
router.get('/', authenticateToken, getContracts);
router.get('/:id', authenticateToken, getContract);
router.put('/:id/status', authenticateToken, updateContractStatus);
router.put('/:id', authenticateToken, requireRole('client'), updateContract);

module.exports = router;
