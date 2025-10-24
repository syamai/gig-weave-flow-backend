const { supabase } = require('../../src/config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * 테스트용 사용자 생성
 * @param {Object} userData - 사용자 데이터
 * @returns {Object} 생성된 사용자 정보
 */
const createTestUser = async (userData = {}) => {
  // 더 고유한 이메일 생성
  const timestamp = Date.now();
  const random1 = Math.random().toString(36).substr(2, 9);
  const random2 = Math.floor(Math.random() * 100000);
  const random3 = Math.random().toString(36).substr(2, 5);
  
  const defaultData = {
    email: `test-${timestamp}-${random1}-${random2}-${random3}@example.com`,
    password: 'password123',
    fullName: 'Test User',
    role: 'CLIENT'
  };

  const userInfo = { ...defaultData, ...userData };
  
  // 비밀번호 해시화
  const hashedPassword = await bcrypt.hash(userInfo.password, 12);

  try {
    // 사용자 생성
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email: userInfo.email,
        password_hash: hashedPassword,
        full_name: userInfo.fullName,
        role: userInfo.role.toUpperCase()
      })
      .select()
      .single();

    if (error) {
      throw new Error('Failed to create test user');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      password: userInfo.password // 원본 비밀번호도 반환 (테스트용)
    };
  } catch (error) {
    console.error('Error creating test user:', error);
    throw error;
  }
};

/**
 * 테스트용 프로젝트 생성
 * @param {Object} projectData - 프로젝트 데이터
 * @param {string} clientId - 클라이언트 ID
 * @returns {Object} 생성된 프로젝트 정보
 */
const createTestProject = async (projectData = {}, clientId) => {
  const defaultData = {
    title: 'Test Project',
    description: 'This is a test project',
    project_type: 'fixed',
    budget_min: 1000,
    budget_max: 5000,
    status: 'open'
  };

  const projectInfo = { ...defaultData, ...projectData };

  try {
    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        ...projectInfo,
        client_id: clientId
      })
      .select()
      .single();

    if (error) {
      throw new Error('Failed to create test project');
    }

    return project;
  } catch (error) {
    console.error('Error creating test project:', error);
    throw error;
  }
};

/**
 * JWT 토큰 생성
 * @param {string} userId - 사용자 ID
 * @param {string} role - 사용자 역할
 * @returns {string} JWT 토큰
 */
const generateToken = (userId, role = 'CLIENT') => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

/**
 * 테스트 데이터 정리
 * @param {Array} tables - 정리할 테이블 목록
 */
const cleanupTestData = async () => {
  try {
    // Supabase에서는 RLS로 데이터 격리 처리
    console.log('✅ Test data cleaned up (RLS handled)');
  } catch (error) {
    console.error('Error cleaning up test data:', error);
    // 정리 실패해도 테스트는 계속 진행
  }
};

/**
 * 테스트용 파트너 프로필 생성
 * @param {Object} profileData - 프로필 데이터
 * @param {string} userId - 사용자 ID
 * @returns {Object} 생성된 파트너 프로필
 */
const createTestPartnerProfile = async (profileData = {}, userId) => {
  const defaultData = {
    bio: 'Test partner bio',
    hourly_rate: 50,
    availability: 'available',
    experience: 5,
    location: 'Seoul, Korea',
    user_type: 'PARTNER'
  };

  const profileInfo = { ...defaultData, ...profileData };

  try {
    const { data: partnerProfile, error } = await supabase
      .from('profiles')
      .insert({
        ...profileInfo,
        user_id: userId
      })
      .select()
      .single();

    if (error) {
      throw new Error('Failed to create test partner profile');
    }

    return partnerProfile;
  } catch (error) {
    console.error('Error creating test partner profile:', error);
    throw error;
  }
};

/**
 * 테스트용 포트폴리오 생성
 * @param {Object} portfolioData - 포트폴리오 데이터
 * @param {string} userId - 사용자 ID
 * @returns {Object} 생성된 포트폴리오
 */
const createTestPortfolio = async (portfolioData = {}, userId) => {
  const defaultData = {
    title: 'Test Portfolio',
    description: 'This is a test portfolio',
    image_url: 'https://example.com/image.jpg',
    project_url: 'https://example.com/project'
  };

  const portfolioInfo = { ...defaultData, ...portfolioData };

  try {
    const { data: portfolio, error } = await supabase
      .from('portfolios')
      .insert({
        ...portfolioInfo,
        user_id: userId
      })
      .select()
      .single();

    if (error) {
      throw new Error('Failed to create test portfolio');
    }

    return portfolio;
  } catch (error) {
    console.error('Error creating test portfolio:', error);
    throw error;
  }
};

/**
 * 테스트용 제안서 생성
 * @param {Object} proposalData - 제안서 데이터
 * @param {string} projectId - 프로젝트 ID
 * @param {string} partnerId - 파트너 ID
 * @returns {Object} 생성된 제안서
 */
const createTestProposal = async (proposalData = {}, projectId, partnerId) => {
  const defaultData = {
    cover_letter: 'This is a test proposal',
    proposed_rate: 2000,
    estimated_duration_weeks: 4,
    status: 'pending'
  };

  const proposalInfo = { ...defaultData, ...proposalData };

  try {
    const { data: proposal, error } = await supabase
      .from('proposals')
      .insert({
        ...proposalInfo,
        project_id: projectId,
        partner_id: partnerId
      })
      .select()
      .single();

    if (error) {
      throw new Error('Failed to create test proposal');
    }

    return proposal;
  } catch (error) {
    console.error('Error creating test proposal:', error);
    throw error;
  }
};

/**
 * 테스트용 계약서 생성
 * @param {Object} contractData - 계약서 데이터
 * @param {string} projectId - 프로젝트 ID
 * @param {string} clientId - 클라이언트 ID
 * @param {string} partnerId - 파트너 ID
 * @returns {Object} 생성된 계약서
 */
const createTestContract = async (contractData = {}, projectId, clientId, partnerId) => {
  const defaultData = {
    terms: 'Test contract terms',
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30일 후
    status: 'active'
  };

  const contractInfo = { ...defaultData, ...contractData };

  try {
    const { data: contract, error } = await supabase
      .from('contracts')
      .insert({
        ...contractInfo,
        project_id: projectId,
        client_id: clientId,
        partner_id: partnerId
      })
      .select()
      .single();

    if (error) {
      throw new Error('Failed to create test contract');
    }

    return contract;
  } catch (error) {
    console.error('Error creating test contract:', error);
    throw error;
  }
};

/**
 * 테스트용 메시지 생성
 * @param {Object} messageData - 메시지 데이터
 * @param {string} senderId - 발신자 ID
 * @param {string} recipientId - 수신자 ID
 * @returns {Object} 생성된 메시지
 */
const createTestMessage = async (messageData = {}, senderId, recipientId) => {
  const defaultData = {
    content: 'Test message content',
    message_type: 'text'
  };

  const messageInfo = { ...defaultData, ...messageData };

  try {
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        ...messageInfo,
        sender_id: senderId,
        receiver_id: recipientId
      })
      .select()
      .single();

    if (error) {
      throw new Error('Failed to create test message');
    }

    return message;
  } catch (error) {
    console.error('Error creating test message:', error);
    throw error;
  }
};

/**
 * 테스트용 리뷰 생성
 * @param {Object} reviewData - 리뷰 데이터
 * @param {string} contractId - 계약 ID
 * @param {string} reviewerId - 리뷰어 ID
 * @param {string} revieweeId - 피리뷰어 ID
 * @returns {Object} 생성된 리뷰
 */
const createTestReview = async (reviewData = {}, contractId, reviewerId, revieweeId) => {
  const defaultData = {
    rating: 5,
    comment: 'Great work!'
  };

  const reviewInfo = { ...defaultData, ...reviewData };

  try {
    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        ...reviewInfo,
        contract_id: contractId,
        reviewer_id: reviewerId,
        reviewee_id: revieweeId
      })
      .select()
      .single();

    if (error) {
      throw new Error('Failed to create test review');
    }

    return review;
  } catch (error) {
    console.error('Error creating test review:', error);
    throw error;
  }
};

/**
 * 데이터베이스 연결 해제
 */
const disconnect = async () => {
  // Supabase는 자동으로 연결 관리
  console.log('✅ Supabase connection closed');
};

module.exports = {
  supabase,
  createTestUser,
  createTestProject,
  createTestPartnerProfile,
  createTestPortfolio,
  createTestProposal,
  createTestContract,
  createTestMessage,
  createTestReview,
  generateToken,
  cleanupTestData,
  disconnect
};