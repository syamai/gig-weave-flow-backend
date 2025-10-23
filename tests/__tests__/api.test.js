const request = require('supertest');

// Prisma를 Mock으로 대체
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    profile: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    },
    project: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    },
    userRole: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn()
    },
    $executeRaw: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn()
  };
  
  return {
    PrismaClient: jest.fn(() => mockPrisma),
    prisma: mockPrisma
  };
});

// app을 import하기 전에 mock 설정
const app = require('../../src/app');

// JWT Mock을 전역적으로 설정
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn((payload, secret, options) => 'mock-jwt-token'),
  verify: jest.fn((token, secret) => {
    if (token === 'valid-token') {
      return { userId: 'user-123', email: 'test@example.com' };
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
      req.user = { userId: 'user-123', email: 'test@example.com', role: 'client' };
      next();
    } else {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
  },
  optionalAuth: (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token === 'valid-token') {
      req.user = { userId: 'user-123', email: 'test@example.com' };
    }
    next();
  },
  requireRole: (role) => (req, res, next) => {
    if (req.user && req.user.role === role) {
      next();
    } else {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
  }
}));

describe('API Tests (Mocked)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Health Check', () => {
    it('should return server status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Server is running');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.environment).toBeDefined();
    });
  });

  describe('Authentication API', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        role: 'client'
      };

      // Mock Prisma responses
      const { prisma } = require('@prisma/client');
      prisma.profile.findUnique.mockResolvedValue(null); // No existing user
      prisma.profile.create.mockResolvedValue({
        id: 'user-123',
        email: userData.email,
        fullName: userData.fullName,
        password: 'hashed-password'
      });
      prisma.userRole.create.mockResolvedValue({
        id: 'role-123',
        userId: 'user-123',
        role: userData.role
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.token).toBeDefined();
    });

    it('should return 400 for duplicate email', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        fullName: 'Test User',
        role: 'client'
      };

      // Mock existing user
      const { prisma } = require('@prisma/client');
      prisma.profile.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: userData.email
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email already registered');
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      // Mock user and password verification
      const { prisma } = require('@prisma/client');
      prisma.profile.findUnique.mockResolvedValue({
        id: 'user-123',
        email: loginData.email,
        fullName: 'Test User',
        password: '$2a$10$hashedpassword' // bcrypt hash
      });
      prisma.userRole.findMany.mockResolvedValue([
        { role: 'client' }
      ]);

      // Mock bcrypt compare
      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.token).toBeDefined();
    });
  });

  describe('Projects API', () => {
    it('should get projects list', async () => {
      const { prisma } = require('@prisma/client');
      prisma.project.findMany.mockResolvedValue([]);
      prisma.project.count.mockResolvedValue(0);
      prisma.$transaction.mockImplementation(async (callback) => {
        const result = await callback(prisma);
        return result;
      });

      const response = await request(app)
        .get('/api/projects')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.projects)).toBe(true);
    });

    it('should create a new project', async () => {
      const projectData = {
        title: 'Test Project',
        description: 'Test project description',
        projectType: 'fixed',
        budgetMin: 1000,
        budgetMax: 5000
      };

      const { prisma } = require('@prisma/client');
      prisma.project.create.mockResolvedValue({
        id: 'project-123',
        ...projectData,
        clientId: 'user-123',
        status: 'open'
      });
      prisma.$transaction.mockImplementation((callback) => callback(prisma));

      // JWT Mock은 전역적으로 설정됨

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', 'Bearer valid-token')
        .send(projectData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.project.title).toBe(projectData.title);
    });
  });

      describe('Users API', () => {
        it('should get user profile', async () => {
          const { prisma } = require('@prisma/client');
          prisma.profile.findUnique.mockResolvedValue({
            id: 'user-123',
            email: 'test@example.com',
            fullName: 'Test User',
            avatarUrl: null,
            phone: null,
            createdAt: new Date(),
            updatedAt: new Date()
          });

          const response = await request(app)
            .get('/api/users/profile/user-123')
            .expect(200);

          expect(response.body.success).toBe(true);
          expect(response.body.data.user).toBeDefined();
          expect(response.body.data.user.id).toBe('user-123');
        });

    it('should return 404 for non-existent user', async () => {
      const { prisma } = require('@prisma/client');
      prisma.profile.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/users/profile/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

      describe('Real-time API', () => {
        it('should subscribe to real-time updates', async () => {
          const subscriptionData = {
            channel: 'projects',
            event: 'INSERT',
            table: 'projects'
          };

          const response = await request(app)
            .post('/api/realtime/subscribe')
            .set('Authorization', 'Bearer valid-token')
            .send(subscriptionData)
            .expect(200);

          expect(response.body.success).toBe(true);
          expect(response.body.data.subscriptionId).toBeDefined();
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

  describe('Error Handling', () => {
    it('should handle 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/unknown-route')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should handle validation errors', async () => {
      const invalidData = {
        email: 'invalid-email' // Invalid email format
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
