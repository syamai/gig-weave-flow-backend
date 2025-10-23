// 목업 제거 - 실제 데이터베이스 사용

const request = require('supertest');
const app = require('../../src/app');
const testUtils = require('../utils/testUtils');

describe('Authentication API', () => {
  beforeEach(async () => {
    // 테스트 데이터 정리
    await testUtils.cleanupTestData();
  });

  afterEach(async () => {
    // 테스트 후 데이터 정리
    await testUtils.cleanupTestData();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        fullName: 'New User',
        role: 'client'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.fullName).toBe(userData.fullName);
      expect(response.body.data.token).toBeDefined();
    });

    it('should return 400 for duplicate email', async () => {
      // 먼저 사용자 생성
      await testUtils.createTestUser({ email: 'duplicate@example.com' });

      const userData = {
        email: 'duplicate@example.com',
        password: 'password123',
        fullName: 'Duplicate User',
        role: 'client'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email already registered');
    });

    it('should return 400 for missing required fields', async () => {
      const userData = {
        email: 'incomplete@example.com'
        // password, fullName, role 누락
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await testUtils.createTestUser({
        email: 'login@example.com',
        password: 'password123'
      });
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'login@example.com',
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

    it('should return 401 for invalid credentials', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 401 for non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });
  });

  describe('GET /api/auth/me', () => {
    let user, token;

    beforeEach(async () => {
      user = await testUtils.createTestUser({
        email: 'me@example.com',
        fullName: 'Me User'
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

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    let user, token;

    beforeEach(async () => {
      user = await testUtils.createTestUser();
      token = testUtils.generateToken(user.id);
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout successful');
    });
  });

  describe('PUT /api/auth/change-password', () => {
    let user, token;

    beforeEach(async () => {
      user = await testUtils.createTestUser({
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

    it('should return 400 for incorrect current password', async () => {
      const changeData = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123'
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send(changeData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Current password is incorrect');
    });
  });

  describe('GET /api/auth/session', () => {
    let user, token;

    beforeEach(async () => {
      user = await testUtils.createTestUser();
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
