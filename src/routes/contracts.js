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
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('client_id, status')
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  if (project.client_id !== clientId) {
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
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select('partner_id, status')
      .eq('id', proposalId)
      .single();

    if (proposalError || !proposal) {
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

    if (proposal.partner_id !== partnerId) {
      return res.status(400).json({
        success: false,
        message: 'Partner ID does not match proposal'
      });
    }
  }

  // 계약 생성
  const { data: newContract, error: contractError } = await supabase
    .from('contracts')
    .insert({
      project_id: projectId,
      partner_id: partnerId,
      proposal_id: proposalId,
      agreed_rate: parseFloat(agreedRate),
      start_date: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
      end_date: endDate ? new Date(endDate).toISOString() : null,
      terms,
      status: 'active'
    })
    .select()
    .single();

  if (contractError) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create contract'
    });
  }

  // 프로젝트 상태 업데이트
  const { error: projectUpdateError } = await supabase
    .from('projects')
    .update({ status: 'in_progress' })
    .eq('id', projectId);

  if (projectUpdateError) {
    console.error('Failed to update project status:', projectUpdateError);
  }

  // 다른 제안서들 거부
  if (proposalId) {
    const { error: proposalUpdateError } = await supabase
      .from('proposals')
      .update({ status: 'rejected' })
      .eq('project_id', projectId)
      .neq('id', proposalId)
      .eq('status', 'pending');

    if (proposalUpdateError) {
      console.error('Failed to update other proposals:', proposalUpdateError);
    }
  }

  const contract = newContract;

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

  let query = supabase
    .from('contracts')
    .select('*')
    .order('created_at', { ascending: false })
    .range(skip, skip + take - 1);

  if (userRole === 'client') {
    query = query.eq('client_id', userId);
  } else if (userRole === 'partner') {
    query = query.eq('partner_id', userId);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data: contracts, error: contractsError } = await query;

  const { count: total, error: countError } = await supabase
    .from('contracts')
    .select('*', { count: 'exact', head: true });

  if (contractsError || countError) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch contracts'
    });
  }

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

  const { data: contract, error: contractError } = await supabase
    .from('contracts')
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
        portfolio_tech_stacks (
          tech_stacks (*)
        )
      ),
      proposals (*)
    `)
    .eq('id', id)
    .single();

  if (contractError || !contract) {
    return res.status(404).json({
      success: false,
      message: 'Contract not found'
    });
  }

  // 권한 확인
  const isClient = contract.projects.client_id === userId;
  const isPartner = contract.profiles.user_id === userId;

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

  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select(`
      *,
      projects (*),
      profiles (*)
    `)
    .eq('id', id)
    .single();

  if (contractError || !contract) {
    return res.status(404).json({
      success: false,
      message: 'Contract not found'
    });
  }

  // 권한 확인
  const isClient = contract.projects.client_id === userId;
  const isPartner = contract.profiles.user_id === userId;

  if (!isClient && !isPartner) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this contract'
    });
  }

  // 계약 상태 업데이트
  const { data: updatedContract, error: updateError } = await supabase
    .from('contracts')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update contract status'
    });
  }

  // 계약 완료 시 프로젝트 상태도 업데이트
  if (status === 'completed') {
    await supabase
      .from('projects')
      .update({ status: 'completed' })
      .eq('id', contract.project_id);
  }

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

  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select(`
      *,
      projects (*),
      profiles (*)
    `)
    .eq('id', id)
    .single();

  if (contractError || !contract) {
    return res.status(404).json({
      success: false,
      message: 'Contract not found'
    });
  }

  // 권한 확인 (클라이언트만 수정 가능)
  if (contract.projects.client_id !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this contract'
    });
  }

  const updateFields = {
    ...updateData,
    agreed_rate: updateData.agreedRate ? parseFloat(updateData.agreedRate) : undefined,
    start_date: updateData.startDate ? new Date(updateData.startDate).toISOString() : undefined,
    end_date: updateData.endDate ? new Date(updateData.endDate).toISOString() : undefined
  };

  const { data: updatedContract, error: updateError } = await supabase
    .from('contracts')
    .update(updateFields)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update contract'
    });
  }

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
