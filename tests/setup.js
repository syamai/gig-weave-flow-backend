// 테스트 환경 설정
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_EXPIRES_IN = '1h';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/gig_weave_flow_test';

// 테스트 데이터베이스 초기화
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// 테스트 전후 데이터베이스 정리
beforeAll(async () => {
  // 테스트 데이터베이스 연결 확인
  await prisma.$connect();
});

afterAll(async () => {
  // 모든 테이블 정리
  await prisma.$executeRaw`TRUNCATE TABLE "notifications" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "reviews" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "messages" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "contracts" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "proposals" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "portfolios" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "partner_tech_stacks" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "partner_profiles" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "project_tech_stacks" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "projects" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "tech_stacks" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "user_roles" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "profiles" CASCADE`;
  
  await prisma.$disconnect();
});

// 각 테스트 후 데이터 정리
afterEach(async () => {
  // 테스트 간 데이터 정리
  await prisma.$executeRaw`TRUNCATE TABLE "notifications" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "reviews" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "messages" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "contracts" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "proposals" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "portfolios" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "partner_tech_stacks" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "partner_profiles" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "project_tech_stacks" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "projects" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "user_roles" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "profiles" CASCADE`;
});

// 전역 테스트 유틸리티
global.testUtils = {
  prisma,
  
  // 테스트 사용자 생성
  createTestUser: async (userData = {}) => {
    const defaultUser = {
      email: 'test@example.com',
      fullName: 'Test User',
      password: 'password123',
      role: 'client',
      ...userData
    };
    
    const user = await prisma.profile.create({
      data: {
        email: defaultUser.email,
        fullName: defaultUser.fullName,
        password: defaultUser.password
      }
    });
    
    await prisma.userRole.create({
      data: {
        userId: user.id,
        role: defaultUser.role
      }
    });
    
    return user;
  },
  
  // JWT 토큰 생성
  generateToken: (userId) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { userId, email: 'test@example.com' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
  }
};
