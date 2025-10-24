const express = require('express');
const { supabase } = require('../config/database');
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
  const { data: partnerProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .eq('user_type', 'PARTNER')
    .single();

  if (profileError || !partnerProfile) {
    return res.status(404).json({
      success: false,
      message: 'Partner profile not found'
    });
  }

  // 프로젝트 존재 확인
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, status')
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
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
  const { data: existingProposal, error: existingError } = await supabase
    .from('proposals')
    .select('id')
    .eq('project_id', projectId)
    .eq('partner_id', partnerProfile.id)
    .single();

  if (existingProposal) {
    return res.status(400).json({
      success: false,
      message: 'Proposal already exists for this project'
    });
  }

  const { data: proposal, error: proposalError } = await supabase
    .from('proposals')
    .insert({
      project_id: projectId,
      partner_id: partnerProfile.id,
      cover_letter: coverLetter,
      proposed_rate: parseFloat(proposedRate),
      estimated_duration_weeks: estimatedDurationWeeks ? parseInt(estimatedDurationWeeks) : null,
      portfolio_links: portfolioLinks
    })
    .select(`
      *,
      projects (*),
      profiles (
        *,
        users (*)
      )
    `)
    .single();

  if (proposalError) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create proposal'
    });
  }

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

  const { data: partnerProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .eq('user_type', 'PARTNER')
    .single();

  if (profileError || !partnerProfile) {
    return res.status(404).json({
      success: false,
      message: 'Partner profile not found'
    });
  }

  let query = supabase
    .from('proposals')
    .select(`
      *,
      projects (
        *,
        project_tech_stacks (
          tech_stacks (*)
        )
      )
    `)
    .eq('partner_id', partnerProfile.id)
    .order('created_at', { ascending: false })
    .range(skip, skip + take - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data: proposals, error: proposalsError } = await query;

  const { count: total, error: countError } = await supabase
    .from('proposals')
    .select('*', { count: 'exact', head: true })
    .eq('partner_id', partnerProfile.id);

  if (proposalsError || countError) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch proposals'
    });
  }

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
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('client_id')
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  if (project.client_id !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view proposals for this project'
    });
  }

  let query = supabase
    .from('proposals')
    .select(`
      *,
      profiles (
        *,
        users (*),
        portfolio_tech_stacks (
          tech_stacks (*)
        ),
        portfolios (
          *
        )
      )
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .range(skip, skip + take - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data: proposals, error: proposalsError } = await query;

  const { count: total, error: countError } = await supabase
    .from('proposals')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId);

  if (proposalsError || countError) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch proposals'
    });
  }

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

  const { data: proposal, error: proposalError } = await supabase
    .from('proposals')
    .select(`
      *,
      projects (
        *,
        project_tech_stacks (
          tech_stacks (*)
        )
      ),
      profiles (
        *,
        users (*),
        portfolio_tech_stacks (
          tech_stacks (*)
        ),
        portfolios (*)
      )
    `)
    .eq('id', id)
    .single();

  if (proposalError || !proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  // 권한 확인
  const isOwner = proposal.profiles.user_id === req.user.id;
  const isProjectOwner = proposal.projects.client_id === req.user.id;

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

  const { data: proposal, error: proposalError } = await supabase
    .from('proposals')
    .select(`
      *,
      projects (*)
    `)
    .eq('id', id)
    .single();

  if (proposalError || !proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  // 프로젝트 소유자 확인
  if (proposal.projects.client_id !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this proposal'
    });
  }

  const { data: updatedProposal, error: updateError } = await supabase
    .from('proposals')
    .update({ status })
    .eq('id', id)
    .select(`
      *,
      projects (*),
      profiles (
        *,
        users (*)
      )
    `)
    .single();

  if (updateError) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update proposal status'
    });
  }

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

  const { data: proposal, error: proposalError } = await supabase
    .from('proposals')
    .select(`
      *,
      profiles (*)
    `)
    .eq('id', id)
    .eq('profiles.user_id', userId)
    .single();

  if (proposalError || !proposal) {
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

  const updateFields = {
    ...updateData,
    proposed_rate: updateData.proposedRate ? parseFloat(updateData.proposedRate) : undefined,
    estimated_duration_weeks: updateData.estimatedDurationWeeks ? parseInt(updateData.estimatedDurationWeeks) : undefined
  };

  const { data: updatedProposal, error: updateError } = await supabase
    .from('proposals')
    .update(updateFields)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update proposal'
    });
  }

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

  const { data: proposal, error: proposalError } = await supabase
    .from('proposals')
    .select(`
      *,
      profiles (*)
    `)
    .eq('id', id)
    .eq('profiles.user_id', userId)
    .single();

  if (proposalError || !proposal) {
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

  const { error: deleteError } = await supabase
    .from('proposals')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete proposal'
    });
  }

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
