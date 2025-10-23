const request = require('supertest');
const app = require('../../src/app');
const testUtils = require('../utils/testUtils');

// JWT Mock을 전역적으로 설정
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn((payload, secret, options) => 'mock-jwt-token'),
  verify: jest.fn((token, secret) => {
    if (token === 'mock-jwt-token') {
      return { userId: 'user-123', email: 'test@example.com', role: 'client' };
    }
    if (token === 'valid-token') {
      return { userId: 'user-123', email: 'test@example.com', role: 'client' };
    }
    throw new Error('Invalid token');
  })
}));

// 인증 미들웨어 Mock
jest.mock('../../src/middleware/auth', () => ({
  authenticateToken: (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token === 'valid-token') {
      req.user = { id: 'user-123', email: 'test@example.com', role: 'client' };
      next();
    } else {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
  },
  optionalAuth: (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token === 'valid-token') {
      req.user = { id: 'user-123', email: 'test@example.com', role: 'client' };
    }
    next();
  },
  authorize: (roles) => (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next();
  },
  requireRole: (roles) => (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next();
  }
}));

describe('Real-time API', () => {
  let user, token;

  beforeEach(async () => {
    // 테스트 데이터 정리
    await testUtils.cleanupTestData();
    
    user = await testUtils.createTestUser({
      email: 'realtime@example.com',
      fullName: 'Realtime User',
      role: 'client'
    });
      token = 'valid-token';
  });

  afterEach(async () => {
    // 테스트 후 데이터 정리
    await testUtils.cleanupTestData();
  });

  describe('POST /api/realtime/subscribe', () => {
    it('should subscribe to real-time updates', async () => {
      const subscriptionData = {
        channel: 'projects',
        event: 'INSERT',
        table: 'projects'
      };

      const response = await request(app)
        .post('/api/realtime/subscribe')
        .set('Authorization', `Bearer ${token}`)
        .send(subscriptionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.subscriptionId).toBeDefined();
    });

    it('should return 400 for invalid subscription data', async () => {
      const subscriptionData = {
        channel: 'projects'
        // event, table 누락
      };

      const response = await request(app)
        .post('/api/realtime/subscribe')
        .set('Authorization', `Bearer ${token}`)
        .send(subscriptionData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const subscriptionData = {
        channel: 'projects',
        event: 'INSERT',
        table: 'projects'
      };

      const response = await request(app)
        .post('/api/realtime/subscribe')
        .send(subscriptionData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/realtime/unsubscribe', () => {
    let subscriptionId;

    beforeEach(async () => {
      // 구독 생성
      const subscriptionData = {
        channel: 'projects',
        event: 'INSERT',
        table: 'projects'
      };

      const response = await request(app)
        .post('/api/realtime/subscribe')
        .set('Authorization', `Bearer ${token}`)
        .send(subscriptionData);

      subscriptionId = response.body.data.subscriptionId;
    });

    it('should unsubscribe from real-time updates', async () => {
      const response = await request(app)
        .post('/api/realtime/unsubscribe')
        .set('Authorization', `Bearer ${token}`)
        .send({ subscriptionId: '123e4567-e89b-12d3-a456-426614174000' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 400 for missing subscription ID', async () => {
      const response = await request(app)
        .post('/api/realtime/unsubscribe')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/realtime/channels', () => {
    beforeEach(async () => {
      // 여러 구독 생성
      const subscriptions = [
        {
          channel: 'projects',
          event: 'INSERT',
          table: 'projects'
        },
        {
          channel: 'messages',
          event: 'INSERT',
          table: 'messages'
        }
      ];

      for (const sub of subscriptions) {
        await request(app)
          .post('/api/realtime/subscribe')
          .set('Authorization', `Bearer ${token}`)
          .send(sub);
      }
    });

    it('should get active channels', async () => {
      const response = await request(app)
        .get('/api/realtime/channels')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.channels)).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/realtime/channels')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/realtime/postgres-changes', () => {
    it('should subscribe to PostgreSQL changes', async () => {
      const changeData = {
        channel: 'projects',
        table: 'projects',
        event: 'INSERT'
      };

      const response = await request(app)
        .post('/api/realtime/postgres-changes')
        .set('Authorization', `Bearer ${token}`)
        .send(changeData);

      console.log('Response status:', response.status);
      console.log('Response body:', response.body);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.subscriptionId).toBeDefined();
    });

    it('should return 400 for invalid change data', async () => {
      const changeData = {
        table: 'projects'
        // channel 누락
      };

      const response = await request(app)
        .post('/api/realtime/postgres-changes')
        .set('Authorization', `Bearer ${token}`)
        .send(changeData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
