const { prisma } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

// 프로젝트 목록 조회
const getProjects = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    projectType,
    budgetRange,
    techStackIds,
    status = 'open'
  } = req.query;

  const skip = (page - 1) * limit;
  const take = parseInt(limit);

  // 필터 조건 구성
  const where = {
    status
  };

  // 검색 조건
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  // 프로젝트 타입 필터
  if (projectType) {
    where.projectType = projectType;
  }

  // 예산 범위 필터
  if (budgetRange && budgetRange !== 'all') {
    switch (budgetRange) {
      case 'under1m':
        where.budgetMax = { lt: 1000000 };
        break;
      case '1m-5m':
        where.budgetMax = { gte: 1000000, lte: 5000000 };
        break;
      case '5m-10m':
        where.budgetMax = { gte: 5000000, lte: 10000000 };
        break;
      case 'over10m':
        where.budgetMax = { gt: 10000000 };
        break;
    }
  }

  // 기술 스택 필터
  if (techStackIds) {
    const techStackArray = techStackIds.split(',');
    where.projectTechStacks = {
      some: {
        techStackId: { in: techStackArray }
      }
    };
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        projectTechStacks: {
          include: {
            techStack: true
          }
        },
        _count: {
          select: {
            proposals: true
          }
        }
      }
    }),
    prisma.project.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      projects,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        pages: Math.ceil(total / take)
      }
    }
  });
});

// 프로젝트 상세 조회
const getProject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      projectTechStacks: {
        include: {
          techStack: true
        }
      },
      proposals: {
        include: {
          partnerProfile: {
            include: {
              partnerTechStacks: {
                include: {
                  techStack: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      contracts: {
        include: {
          partnerProfile: true
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

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  res.json({
    success: true,
    data: { project }
  });
});

// 프로젝트 생성
const createProject = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    projectType,
    budgetMin,
    budgetMax,
    durationWeeks,
    techStackIds = []
  } = req.body;

  const clientId = req.user.id;

  const project = await prisma.$transaction(async (tx) => {
    // 프로젝트 생성
    const newProject = await tx.project.create({
      data: {
        clientId,
        title,
        description,
        projectType,
        budgetMin: budgetMin ? parseFloat(budgetMin) : null,
        budgetMax: budgetMax ? parseFloat(budgetMax) : null,
        durationWeeks: durationWeeks ? parseInt(durationWeeks) : null,
        status: 'open'
      }
    });

    // 기술 스택 연결
    if (techStackIds.length > 0) {
      await tx.projectTechStack.createMany({
        data: techStackIds.map(techStackId => ({
          projectId: newProject.id,
          techStackId
        }))
      });
    }

    return newProject;
  });

  res.status(201).json({
    success: true,
    message: 'Project created successfully',
    data: { project }
  });
});

// 프로젝트 수정
const updateProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // 프로젝트 소유자 확인
  const existingProject = await prisma.project.findUnique({
    where: { id },
    select: { clientId: true }
  });

  if (!existingProject) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  if (existingProject.clientId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this project'
    });
  }

  const project = await prisma.$transaction(async (tx) => {
    // 프로젝트 업데이트
    const updatedProject = await tx.project.update({
      where: { id },
      data: {
        ...updateData,
        budgetMin: updateData.budgetMin ? parseFloat(updateData.budgetMin) : undefined,
        budgetMax: updateData.budgetMax ? parseFloat(updateData.budgetMax) : undefined,
        durationWeeks: updateData.durationWeeks ? parseInt(updateData.durationWeeks) : undefined
      }
    });

    // 기술 스택 업데이트
    if (updateData.techStackIds) {
      // 기존 기술 스택 삭제
      await tx.projectTechStack.deleteMany({
        where: { projectId: id }
      });

      // 새 기술 스택 추가
      if (updateData.techStackIds.length > 0) {
        await tx.projectTechStack.createMany({
          data: updateData.techStackIds.map(techStackId => ({
            projectId: id,
            techStackId
          }))
        });
      }
    }

    return updatedProject;
  });

  res.json({
    success: true,
    message: 'Project updated successfully',
    data: { project }
  });
});

// 프로젝트 삭제
const deleteProject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 프로젝트 소유자 확인
  const existingProject = await prisma.project.findUnique({
    where: { id },
    select: { clientId: true, status: true }
  });

  if (!existingProject) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  if (existingProject.clientId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this project'
    });
  }

  // 진행 중인 계약이 있는지 확인
  if (existingProject.status === 'in_progress') {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete project with active contracts'
    });
  }

  await prisma.project.delete({
    where: { id }
  });

  res.json({
    success: true,
    message: 'Project deleted successfully'
  });
});

// 내 프로젝트 목록 조회
const getMyProjects = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status
  } = req.query;

  const skip = (page - 1) * limit;
  const take = parseInt(limit);
  const clientId = req.user.id;

  const where = { clientId };
  if (status) {
    where.status = status;
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        projectTechStacks: {
          include: {
            techStack: true
          }
        },
        _count: {
          select: {
            proposals: true,
            contracts: true
          }
        }
      }
    }),
    prisma.project.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      projects,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        pages: Math.ceil(total / take)
      }
    }
  });
});

module.exports = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getMyProjects
};
