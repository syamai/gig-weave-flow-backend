const request = require('supertest');
const app = require('../../src/app');
const testUtils = require('../utils/testUtils');

describe('Integration Tests', () => {
  let client, partner, clientToken, partnerToken;

  beforeEach(async () => {
    // 테스트 데이터 정리
    await testUtils.cleanupTestData();
    
    // 고유한 이메일 생성
    const timestamp = Date.now();
    
    // 클라이언트와 파트너 생성
    client = await testUtils.createTestUser({
      email: `client-${timestamp}@example.com`,
      fullName: 'Client User',
      role: 'client'
    });
    clientToken = testUtils.generateToken(client.id);

    partner = await testUtils.createTestUser({
      email: `partner-${timestamp}@example.com`,
      fullName: 'Partner User',
      role: 'partner'
    });
    partnerToken = testUtils.generateToken(partner.id);
  });

  describe('Complete Project Workflow', () => {
    it('should complete full project lifecycle', async () => {
      // 1. 클라이언트가 프로젝트 생성
      const projectData = {
        title: 'Integration Test Project',
        description: 'Test project for integration testing',
        projectType: 'fixed',
        budgetMin: 1000,
        budgetMax: 5000,
        durationWeeks: 4
      };

      const createProjectResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(projectData)
        .expect(201);

      const projectId = createProjectResponse.body.data.project.id;
      expect(createProjectResponse.body.success).toBe(true);

      // 2. 프로젝트 조회
      const getProjectResponse = await request(app)
        .get(`/api/projects/${projectId}`)
        .expect(200);

      expect(getProjectResponse.body.data.project.title).toBe(projectData.title);

      // 3. 프로젝트 목록 조회
      const listProjectsResponse = await request(app)
        .get('/api/projects')
        .expect(200);

      expect(listProjectsResponse.body.data.projects.length).toBeGreaterThan(0);

      // 4. 클라이언트의 내 프로젝트 조회
      const myProjectsResponse = await request(app)
        .get('/api/projects/my/projects')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(myProjectsResponse.body.data.projects.length).toBeGreaterThan(0);

      // 5. 프로젝트 업데이트
      const updateData = {
        title: 'Updated Integration Test Project',
        description: 'Updated description'
      };

      const updateProjectResponse = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send(updateData)
        .expect(200);

      expect(updateProjectResponse.body.data.project.title).toBe(updateData.title);

      // 6. 프로젝트 삭제
      const deleteProjectResponse = await request(app)
        .delete(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(deleteProjectResponse.body.success).toBe(true);
    });
  });

  describe('Authentication Workflow', () => {
    it('should complete full authentication lifecycle', async () => {
      // 1. 사용자 등록
      const registerData = {
        email: 'integration@example.com',
        password: 'password123',
        fullName: 'Integration User',
        role: 'client'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      const token = registerResponse.body.data.token;

      // 2. 로그인
      const loginData = {
        email: registerData.email,
        password: registerData.password
      };

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(loginResponse.body.success).toBe(true);

      // 3. 사용자 정보 조회
      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(meResponse.body.data.user.email).toBe(registerData.email);

      // 4. 세션 확인
      const sessionResponse = await request(app)
        .get('/api/auth/session')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(sessionResponse.body.success).toBe(true);

      // 5. 비밀번호 변경
      const changePasswordData = {
        currentPassword: registerData.password,
        newPassword: 'newpassword123'
      };

      const changePasswordResponse = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send(changePasswordData)
        .expect(200);

      expect(changePasswordResponse.body.success).toBe(true);

      // 6. 로그아웃
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(logoutResponse.body.success).toBe(true);
    });
  });

  describe('User Profile Workflow', () => {
    it('should complete user profile management', async () => {
      // 1. 프로필 조회
      const getProfileResponse = await request(app)
        .get(`/api/users/profile/${client.id}`)
        .expect(200);

      expect(getProfileResponse.body.data.user.id).toBe(client.id);

      // 2. 프로필 업데이트
      const updateProfileData = {
        fullName: 'Updated Client Name',
        bio: 'Updated bio information',
        location: 'Seoul, Korea'
      };

      const updateProfileResponse = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(updateProfileData)
        .expect(200);

      expect(updateProfileResponse.body.data.user.fullName).toBe(updateProfileData.fullName);

      // 3. 사용자 통계 조회
      const statsResponse = await request(app)
        .get('/api/users/stats')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(statsResponse.body.success).toBe(true);
    });
  });

  describe('Real-time Workflow', () => {
    it('should complete real-time subscription workflow', async () => {
      // 1. 실시간 구독
      const subscribeData = {
        channel: 'projects',
        event: 'INSERT',
        table: 'projects'
      };

      const subscribeResponse = await request(app)
        .post('/api/realtime/subscribe')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(subscribeData)
        .expect(200);

      expect(subscribeResponse.body.success).toBe(true);
      const subscriptionId = subscribeResponse.body.data.subscriptionId;

      // 2. 활성 채널 조회
      const channelsResponse = await request(app)
        .get('/api/realtime/channels')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(channelsResponse.body.data.channels).toBeDefined();
      expect(Array.isArray(channelsResponse.body.data.channels)).toBe(true);

      // 3. PostgreSQL 변경사항 구독
      const postgresChangesData = {
        channel: 'projects',
        table: 'projects',
        event: 'INSERT'
      };

      const postgresChangesResponse = await request(app)
        .post('/api/realtime/postgres-changes')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(postgresChangesData)
        .expect(200);

      expect(postgresChangesResponse.body.success).toBe(true);

      // 4. 구독 해제 (유효한 UUID 형식으로)
      const unsubscribeResponse = await request(app)
        .post('/api/realtime/unsubscribe')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ subscriptionId: '123e4567-e89b-12d3-a456-426614174000' })
        .expect(200);

      expect(unsubscribeResponse.body.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors properly', async () => {
      // 잘못된 토큰으로 요청
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should handle authorization errors properly', async () => {
      // 프로젝트 생성
      const project = await testUtils.prisma.project.create({
        data: {
          clientId: client.id,
          title: 'Test Project',
          description: 'Test description',
          projectType: 'fixed',
          status: 'open'
        }
      });

      // 다른 사용자가 프로젝트 수정 시도
      const response = await request(app)
        .put(`/api/projects/${project.id}`)
        .set('Authorization', `Bearer ${partnerToken}`)
        .send({ title: 'Unauthorized Update' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should handle validation errors properly', async () => {
      // 필수 필드 누락으로 프로젝트 생성 시도
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ title: 'Incomplete Project' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
