const request = require('supertest');
const app = require('../../src/app');
const testUtils = require('../utils/testUtils');

// 목업 제거 - 실제 데이터베이스 사용

describe('Users API', () => {
  let user, token;

  beforeEach(async () => {
    // 테스트 데이터 정리
    await testUtils.cleanupTestData();
    
    user = await testUtils.createTestUser({
      email: 'user@example.com',
      fullName: 'Test User',
      role: 'client'
    });
    token = testUtils.generateToken(user.id);
  });

  afterEach(async () => {
    // 테스트 후 데이터 정리
    await testUtils.cleanupTestData();
  });

  describe('GET /api/users/profile/:id', () => {
    it('should get user profile by id', async () => {
      const response = await request(app)
        .get(`/api/users/profile/${user.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(user.id);
      expect(response.body.data.user.email).toBe(user.email);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/profile/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update user profile', async () => {
      const updateData = {
        fullName: 'Updated Name',
        bio: 'Updated bio',
        location: 'Seoul, Korea'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.fullName).toBe(updateData.fullName);
    });

    it('should return 401 without authentication', async () => {
      const updateData = {
        fullName: 'Updated Name'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users/stats', () => {
    beforeEach(async () => {
      // 사용자 통계를 위한 테스트 데이터 생성
      await testUtils.prisma.project.createMany({
        data: [
          {
            clientId: user.id,
            title: 'Project 1',
            description: 'Description 1',
            projectType: 'fixed',
            status: 'completed'
          },
          {
            clientId: user.id,
            title: 'Project 2',
            description: 'Description 2',
            projectType: 'hourly',
            status: 'in_progress'
          }
        ]
      });
    });

    it('should get user statistics', async () => {
      const response = await request(app)
        .get('/api/users/stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toBeDefined();
      expect(response.body.data.stats.totalProjects).toBeDefined();
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/users/stats')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
