const request = require('supertest');
const app = require('../../src/app');
const testUtils = require('../utils/testUtils');

describe('Users API (Simple)', () => {
  beforeEach(async () => {
    await testUtils.cleanupTestData();
  });

  afterEach(async () => {
    await testUtils.cleanupTestData();
  });

  describe('GET /api/users/profile/:id', () => {
    let user;

    beforeEach(async () => {
      user = await testUtils.createTestUser({
        email: 'profile@example.com',
        fullName: 'Profile User'
      });
    });

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
    let user, token;

    beforeEach(async () => {
      user = await testUtils.createTestUser({
        email: 'update@example.com',
        fullName: 'Update User'
      });
      token = testUtils.generateToken(user.id);
    });

    it('should update user profile', async () => {
      const updateData = {
        fullName: 'Updated Name',
        phone: '010-1234-5678'
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
    let user, token;

    beforeEach(async () => {
      user = await testUtils.createTestUser({
        email: 'stats@example.com',
        fullName: 'Stats User',
        role: 'client'
      });
      token = testUtils.generateToken(user.id);
    });

    it('should get user statistics', async () => {
      const response = await request(app)
        .get('/api/users/stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toBeDefined();
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/users/stats')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
