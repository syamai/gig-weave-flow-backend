const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

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
    role: 'client'
  };

  const userInfo = { ...defaultData, ...userData };
  
  // 비밀번호 해시화
  const hashedPassword = await bcrypt.hash(userInfo.password, 12);

  try {
    // 사용자 생성
    const user = await prisma.profile.create({
      data: {
        email: userInfo.email,
        password: hashedPassword,
        fullName: userInfo.fullName,
        userRole: {
          create: {
            role: userInfo.role
          }
        }
      },
      include: {
        userRole: true
      }
    });

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.userRole.role,
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
    projectType: 'fixed',
    budgetMin: 1000,
    budgetMax: 5000,
    status: 'open'
  };

  const projectInfo = { ...defaultData, ...projectData };

  try {
    const project = await prisma.project.create({
      data: {
        ...projectInfo,
        clientId: clientId
      }
    });

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
const generateToken = (userId, role = 'client') => {
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
    // 모든 테이블을 한 번에 정리
    await prisma.$executeRaw`
      TRUNCATE TABLE
        notifications,
        reviews,
        messages,
        contracts,
        proposals,
        projects,
        user_roles,
        profiles
      RESTART IDENTITY CASCADE;
    `;
    console.log('✅ Test data cleaned up');
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
    hourlyRate: 50,
    availability: 'available',
    experience: 5,
    location: 'Seoul, Korea'
  };

  const profileInfo = { ...defaultData, ...profileData };

  try {
    const partnerProfile = await prisma.partnerProfile.create({
      data: {
        ...profileInfo,
        userId: userId
      }
    });

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
    imageUrl: 'https://example.com/image.jpg',
    projectUrl: 'https://example.com/project'
  };

  const portfolioInfo = { ...defaultData, ...portfolioData };

  try {
    const portfolio = await prisma.portfolio.create({
      data: {
        ...portfolioInfo,
        userId: userId
      }
    });

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
    coverLetter: 'This is a test proposal',
    proposedRate: 2000,
    estimatedDurationWeeks: 4,
    status: 'pending'
  };

  const proposalInfo = { ...defaultData, ...proposalData };

  try {
    const proposal = await prisma.proposal.create({
      data: {
        ...proposalInfo,
        projectId: projectId,
        partnerId: partnerId
      }
    });

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
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30일 후
    status: 'active'
  };

  const contractInfo = { ...defaultData, ...contractData };

  try {
    const contract = await prisma.contract.create({
      data: {
        ...contractInfo,
        projectId: projectId,
        clientId: clientId,
        partnerId: partnerId
      }
    });

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
    messageType: 'text'
  };

  const messageInfo = { ...defaultData, ...messageData };

  try {
    const message = await prisma.message.create({
      data: {
        ...messageInfo,
        senderId: senderId,
        recipientId: recipientId
      }
    });

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
    const review = await prisma.review.create({
      data: {
        ...reviewInfo,
        contractId: contractId,
        reviewerId: reviewerId,
        revieweeId: revieweeId
      }
    });

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
  await prisma.$disconnect();
};

module.exports = {
  prisma,
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
