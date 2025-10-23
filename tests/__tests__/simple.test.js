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

// JWT Mock
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-jwt-token'),
  verify: jest.fn((token) => {
    if (token === 'valid-token') {
      return { userId: 'user-123', email: 'test@example.com' };
    }
    throw new Error('Invalid token');
  })
}));

// bcrypt Mock
jest.mock('bcryptjs', () => ({
  hash: jest.fn(() => 'hashed-password'),
  compare: jest.fn(() => true)
}));

const app = require('../../src/app');

describe('Simple API Tests', () => {
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
    });
  });

  describe('Authentication', () => {
    it('should register a new user', async () => {
      const { prisma } = require('@prisma/client');
      prisma.profile.findUnique.mockResolvedValue(null);
      prisma.profile.create.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'Test User'
      });
      prisma.userRole.create.mockResolvedValue({
        id: 'role-123',
        userId: 'user-123',
        role: 'client'
      });

      const userData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        role: 'client'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
    });

    it('should login with valid credentials', async () => {
      const { prisma } = require('@prisma/client');
      prisma.profile.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'Test User',
        password: 'hashed-password'
      });
      prisma.userRole.findMany.mockResolvedValue([
        { role: 'client' }
      ]);

      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(loginData.email);
    });
  });

  describe('Projects', () => {
    it('should get projects list', async () => {
      const { prisma } = require('@prisma/client');
      prisma.project.findMany.mockResolvedValue([]);
      prisma.project.count.mockResolvedValue(0);
      prisma.$transaction.mockImplementation(async (callback) => {
        return await callback(prisma);
      });

      const response = await request(app)
        .get('/api/projects')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.projects)).toBe(true);
    });
  });

  describe('Users', () => {
    it('should get user profile', async () => {
      const { prisma } = require('@prisma/client');
      prisma.profile.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'Test User'
      });

      const response = await request(app)
        .get('/api/users/profile/user-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/unknown-route')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});
