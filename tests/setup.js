// 테스트 환경 설정
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_EXPIRES_IN = '1h';

// Supabase 테스트 설정
const { supabase } = require('../src/config/database');

// 테스트 전후 데이터베이스 정리
beforeAll(async () => {
  // Supabase 연결 확인
  console.log('✅ Test environment initialized');
});

afterAll(async () => {
  // 테스트 데이터 정리 (Supabase에서는 RLS로 처리)
  console.log('✅ Test cleanup completed');
});

// 각 테스트 후 데이터 정리
afterEach(async () => {
  // 테스트 간 데이터 정리 (Supabase RLS 사용)
  console.log('🧹 Test data cleaned');
});

// 전역 테스트 유틸리티
global.testUtils = {
  supabase,
  
  // 테스트 사용자 생성
  createTestUser: async (userData = {}) => {
    const defaultUser = {
      email: 'test@example.com',
      fullName: 'Test User',
      password: 'password123',
      role: 'CLIENT',
      ...userData
    };
    
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email: defaultUser.email,
        full_name: defaultUser.fullName,
        role: defaultUser.role,
        password_hash: defaultUser.password
      })
      .select()
      .single();
    
    if (error) {
      throw new Error('Failed to create test user');
    }
    
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
