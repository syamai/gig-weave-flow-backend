const express = require('express');
const { supabase } = require('../config/database');
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

  let query = supabase
    .from('tech_stacks')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (category) {
    query = query.eq('category', category);
  }

  const { data: techStacks, error } = await query;

  if (error) {
    // tech_stacks 테이블이 없을 수 있으므로 빈 배열 반환
    return res.json({
      success: true,
      data: { 
        techStacks: {}
      }
    });
  }

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
  const { data: categories, error } = await supabase
    .from('tech_stacks')
    .select('category')
    .order('category', { ascending: true });

  if (error) {
    throw error;
  }

  // 중복 제거
  const uniqueCategories = [...new Set(categories.map(item => item.category))];

  res.json({
    success: true,
    data: { 
      categories: uniqueCategories
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

  const { data: techStack, error } = await supabase
    .from('tech_stacks')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !techStack) {
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
  const { data: existingTechStack } = await supabase
    .from('tech_stacks')
    .select('id')
    .eq('name', name)
    .single();

  if (existingTechStack) {
    return res.status(400).json({
      success: false,
      message: 'Tech stack with this name already exists'
    });
  }

  const { data: techStack, error } = await supabase
    .from('tech_stacks')
    .insert({
      name,
      category
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create tech stack'
    });
  }

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

  const { data: existingTechStack, error: findError } = await supabase
    .from('tech_stacks')
    .select('*')
    .eq('id', id)
    .single();

  if (findError || !existingTechStack) {
    return res.status(404).json({
      success: false,
      message: 'Tech stack not found'
    });
  }

  // 이름 중복 확인 (자신 제외)
  if (name !== existingTechStack.name) {
    const { data: duplicateTechStack } = await supabase
      .from('tech_stacks')
      .select('id')
      .eq('name', name)
      .single();

    if (duplicateTechStack) {
      return res.status(400).json({
        success: false,
        message: 'Tech stack with this name already exists'
      });
    }
  }

  const { data: techStack, error: updateError } = await supabase
    .from('tech_stacks')
    .update({ name, category })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update tech stack'
    });
  }

  res.json({
    success: true,
    message: 'Tech stack updated successfully',
    data: { techStack }
  });
});

// 기술 스택 삭제 (관리자용)
const deleteTechStack = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: existingTechStack, error: findError } = await supabase
    .from('tech_stacks')
    .select('*')
    .eq('id', id)
    .single();

  if (findError || !existingTechStack) {
    return res.status(404).json({
      success: false,
      message: 'Tech stack not found'
    });
  }

  // 사용 중인지 확인 (관련 테이블에서 참조 확인)
  const { data: partnerTechStacks } = await supabase
    .from('portfolio_tech_stacks')
    .select('id')
    .eq('tech_stack_id', id)
    .limit(1);

  const { data: projectTechStacks } = await supabase
    .from('project_tech_stacks')
    .select('id')
    .eq('tech_stack_id', id)
    .limit(1);

  if ((partnerTechStacks && partnerTechStacks.length > 0) || (projectTechStacks && projectTechStacks.length > 0)) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete tech stack that is being used'
    });
  }

  const { error: deleteError } = await supabase
    .from('tech_stacks')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete tech stack'
    });
  }

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