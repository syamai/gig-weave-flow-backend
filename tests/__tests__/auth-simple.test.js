const request = require('supertest');
const app = require('../../src/app');
const testUtils = require('../utils/testUtils');

describe('Authentication API (Simple)', () => {
  beforeEach(async () => {
    await testUtils.cleanupTestData();
  });

  afterEach(async () => {
    await testUtils.cleanupTestData();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'simple@example.com',
        password: 'password123',
        fullName: 'Simple User',
        role: 'client'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.token).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await testUtils.createTestUser({
        email: 'login-simple@example.com',
        password: 'password123'
      });
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'login-simple@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.token).toBeDefined();
    });
  });

  describe('GET /api/auth/me', () => {
    let user, token;

    beforeEach(async () => {
      user = await testUtils.createTestUser({
        email: 'me-simple@example.com',
        fullName: 'Me Simple User'
      });
      token = testUtils.generateToken(user.id);
    });

    it('should return user info with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(user.email);
      expect(response.body.data.user.fullName).toBe(user.fullName);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/auth/change-password', () => {
    let user, token;

    beforeEach(async () => {
      user = await testUtils.createTestUser({
        email: 'change-password@example.com',
        password: 'oldpassword123'
      });
      token = testUtils.generateToken(user.id);
    });

    it('should change password successfully', async () => {
      const changeData = {
        currentPassword: 'oldpassword123',
        newPassword: 'newpassword123'
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send(changeData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password changed successfully');
    });
  });

  describe('GET /api/auth/session', () => {
    let user, token;

    beforeEach(async () => {
      user = await testUtils.createTestUser({
        email: 'session@example.com',
        fullName: 'Session User'
      });
      token = testUtils.generateToken(user.id);
    });

    it('should return session info', async () => {
      const response = await request(app)
        .get('/api/auth/session')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.session.user.email).toBe(user.email);
      expect(response.body.data.session.access_token).toBeDefined();
    });
  });
});
