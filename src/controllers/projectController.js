const { supabase } = require('../config/database');
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

  // Supabase 쿼리 구성
  let query = supabase
    .from('projects')
    .select(`
      *,
      project_tech_stacks (
        tech_stacks (
          id,
          name,
          category
        )
      )
    `)
    .eq('status', status)
    .order('created_at', { ascending: false })
    .range(skip, skip + take - 1);

  // 검색 조건 추가
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }
  if (projectType) {
    query = query.eq('project_type', projectType);
  }
  if (budgetRange) {
    const [min, max] = budgetRange.split('-').map(Number);
    if (min) query = query.gte('budget_min', min);
    if (max) query = query.lte('budget_max', max);
  }
  if (techStackIds) {
    query = query.in('id', 
      supabase
        .from('project_tech_stacks')
        .select('project_id')
        .in('tech_stack_id', techStackArray)
    );
  }

  const { data: projects, error: projectsError } = await query;

  if (projectsError) {
    throw projectsError;
  }

  // 총 개수 조회
  let countQuery = supabase
    .from('projects')
    .select('id', { count: 'exact' })
    .eq('status', status);

  if (search) {
    countQuery = countQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }
  if (projectType) {
    countQuery = countQuery.eq('project_type', projectType);
  }
  if (budgetRange) {
    const [min, max] = budgetRange.split('-').map(Number);
    if (min) countQuery = countQuery.gte('budget_min', min);
    if (max) countQuery = countQuery.lte('budget_max', max);
  }

  const { count: total, error: countError } = await countQuery;

  if (countError) {
    throw countError;
  }

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

  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      *,
      project_tech_stacks (
        tech_stacks (
          id,
          name,
          category
        )
      ),
      proposals (
        *,
        profiles!proposals_freelancer_id_fkey (
          *,
          users!profiles_user_id_fkey (
            full_name,
            email
          )
        )
      ),
      contracts (
        *,
        profiles!contracts_freelancer_id_fkey (
          *,
          users!profiles_user_id_fkey (
            full_name,
            email
          )
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error || !project) {
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

  // 프로젝트 생성
  const { data: newProject, error: projectError } = await supabase
    .from('projects')
    .insert({
      client_id: clientId,
      title,
      description,
      project_type: projectType,
      budget_min: budgetMin ? parseFloat(budgetMin) : null,
      budget_max: budgetMax ? parseFloat(budgetMax) : null,
      duration_weeks: durationWeeks ? parseInt(durationWeeks) : null,
      status: 'open'
    })
    .select()
    .single();

  if (projectError) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create project'
    });
  }

  // 기술 스택 연결
  if (techStackIds.length > 0) {
    const techStackData = techStackIds.map(techStackId => ({
      project_id: newProject.id,
      tech_stack_id: techStackId
    }));

    const { error: techStackError } = await supabase
      .from('project_tech_stacks')
      .insert(techStackData);

    if (techStackError) {
      console.error('Failed to link tech stacks:', techStackError);
    }
  }

  const project = newProject;

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
  const { data: existingProject, error: projectError } = await supabase
    .from('projects')
    .select('client_id')
    .eq('id', id)
    .single();

  if (projectError || !existingProject) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  if (existingProject.client_id !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this project'
    });
  }

  // 프로젝트 업데이트
  const updateFields = {
    ...updateData,
    budget_min: updateData.budgetMin ? parseFloat(updateData.budgetMin) : undefined,
    budget_max: updateData.budgetMax ? parseFloat(updateData.budgetMax) : undefined,
    duration_weeks: updateData.durationWeeks ? parseInt(updateData.durationWeeks) : undefined
  };

  const { data: updatedProject, error: updateError } = await supabase
    .from('projects')
    .update(updateFields)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update project'
    });
  }

  // 기술 스택 업데이트
  if (updateData.techStackIds) {
    // 기존 기술 스택 삭제
    await supabase
      .from('project_tech_stacks')
      .delete()
      .eq('project_id', id);

    // 새 기술 스택 추가
    if (updateData.techStackIds.length > 0) {
      const techStackData = updateData.techStackIds.map(techStackId => ({
        project_id: id,
        tech_stack_id: techStackId
      }));

      await supabase
        .from('project_tech_stacks')
        .insert(techStackData);
    }
  }

  const project = updatedProject;

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
  const { data: existingProject, error: projectError } = await supabase
    .from('projects')
    .select('client_id, status')
    .eq('id', id)
    .single();

  if (projectError || !existingProject) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  if (existingProject.client_id !== req.user.id) {
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

  const { error: deleteError } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete project'
    });
  }

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

  let query = supabase
    .from('projects')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .range(skip, skip + take - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data: projects, error: projectsError } = await query;

  const { count: total, error: countError } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId);

  if (projectsError || countError) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch projects'
    });
  }

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
