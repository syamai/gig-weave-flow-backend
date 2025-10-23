const express = require('express');
const { prisma } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @swagger
 * /api/tech-stacks:
 *   get:
 *     summary: 기술 스택 목록 조회
 *     tags: [Tech Stacks]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: 카테고리로 필터링
 *     responses:
 *       200:
 *         description: 기술 스택 목록 조회 성공
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
 *                         techStacks:
 *                           type: object
 *                           description: 카테고리별로 그룹화된 기술 스택
 *                           additionalProperties:
 *                             type: array
 *                             items:
 *                               $ref: '#/components/schemas/TechStack'
 *                         allTechStacks:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/TechStack'
 *                           description: 모든 기술 스택 목록
 */
const getTechStacks = asyncHandler(async (req, res) => {
  const { category } = req.query;

  const where = {};
  if (category) {
    where.category = category;
  }

  const techStacks = await prisma.techStack.findMany({
    where,
    orderBy: [
      { category: 'asc' },
      { name: 'asc' }
    ]
  });

  // 카테고리별로 그룹화
  const groupedTechStacks = techStacks.reduce((acc, techStack) => {
    if (!acc[techStack.category]) {
      acc[techStack.category] = [];
    }
    acc[techStack.category].push(techStack);
    return acc;
  }, {});

  res.json({
    success: true,
    data: { 
      techStacks: groupedTechStacks,
      allTechStacks: techStacks
    }
  });
});

/**
 * @swagger
 * /api/tech-stacks/categories:
 *   get:
 *     summary: 기술 스택 카테고리 목록 조회
 *     tags: [Tech Stacks]
 *     responses:
 *       200:
 *         description: 카테고리 목록 조회 성공
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
 *                         categories:
 *                           type: array
 *                           items:
 *                             type: string
 *                           description: 카테고리 목록
 */
const getCategories = asyncHandler(async (req, res) => {
  const categories = await prisma.techStack.findMany({
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' }
  });

  res.json({
    success: true,
    data: { 
      categories: categories.map(c => c.category)
    }
  });
});

/**
 * @swagger
 * /api/tech-stacks/{id}:
 *   get:
 *     summary: 기술 스택 상세 조회
 *     tags: [Tech Stacks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 기술 스택 ID
 *     responses:
 *       200:
 *         description: 기술 스택 상세 조회 성공
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
 *                         techStack:
 *                           allOf:
 *                             - $ref: '#/components/schemas/TechStack'
 *                             - type: object
 *                               properties:
 *                                 partnerTechStacks:
 *                                   type: array
 *                                   description: 이 기술을 사용하는 파트너들
 *                                 projectTechStacks:
 *                                   type: array
 *                                   description: 이 기술을 사용하는 프로젝트들
 *       404:
 *         description: 기술 스택을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
const getTechStack = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const techStack = await prisma.techStack.findUnique({
    where: { id },
    include: {
      partnerTechStacks: {
        include: {
          partnerProfile: {
            include: {
              profile: true
            }
          }
        }
      },
      projectTechStacks: {
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
      }
    }
  });

  if (!techStack) {
    return res.status(404).json({
      success: false,
      message: 'Tech stack not found'
    });
  }

  res.json({
    success: true,
    data: { techStack }
  });
});

// 기술 스택 생성 (관리자용)
const createTechStack = asyncHandler(async (req, res) => {
  const { name, category } = req.body;

  // 중복 확인
  const existingTechStack = await prisma.techStack.findUnique({
    where: { name }
  });

  if (existingTechStack) {
    return res.status(400).json({
      success: false,
      message: 'Tech stack with this name already exists'
    });
  }

  const techStack = await prisma.techStack.create({
    data: {
      name,
      category
    }
  });

  res.status(201).json({
    success: true,
    message: 'Tech stack created successfully',
    data: { techStack }
  });
});

// 기술 스택 수정 (관리자용)
const updateTechStack = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, category } = req.body;

  const existingTechStack = await prisma.techStack.findUnique({
    where: { id }
  });

  if (!existingTechStack) {
    return res.status(404).json({
      success: false,
      message: 'Tech stack not found'
    });
  }

  // 이름 중복 확인 (자신 제외)
  if (name !== existingTechStack.name) {
    const duplicateTechStack = await prisma.techStack.findUnique({
      where: { name }
    });

    if (duplicateTechStack) {
      return res.status(400).json({
        success: false,
        message: 'Tech stack with this name already exists'
      });
    }
  }

  const techStack = await prisma.techStack.update({
    where: { id },
    data: { name, category }
  });

  res.json({
    success: true,
    message: 'Tech stack updated successfully',
    data: { techStack }
  });
});

// 기술 스택 삭제 (관리자용)
const deleteTechStack = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existingTechStack = await prisma.techStack.findUnique({
    where: { id },
    include: {
      partnerTechStacks: true,
      projectTechStacks: true
    }
  });

  if (!existingTechStack) {
    return res.status(404).json({
      success: false,
      message: 'Tech stack not found'
    });
  }

  // 사용 중인지 확인
  if (existingTechStack.partnerTechStacks.length > 0 || existingTechStack.projectTechStacks.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete tech stack that is being used'
    });
  }

  await prisma.techStack.delete({
    where: { id }
  });

  res.json({
    success: true,
    message: 'Tech stack deleted successfully'
  });
});

// 공개 라우트
router.get('/', getTechStacks);
router.get('/categories', getCategories);
router.get('/:id', getTechStack);

// 관리자 라우트 (추후 권한 체크 추가)
// router.post('/', authenticateToken, requireRole('admin'), createTechStack);
// router.put('/:id', authenticateToken, requireRole('admin'), updateTechStack);
// router.delete('/:id', authenticateToken, requireRole('admin'), deleteTechStack);

module.exports = router;