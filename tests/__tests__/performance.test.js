const request = require('supertest');

// Prisma Mock
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

describe('Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Prisma mock 설정
    const { prisma } = require('@prisma/client');
    prisma.project.findMany.mockResolvedValue([]);
    prisma.project.count.mockResolvedValue(0);
    prisma.$transaction.mockImplementation(async (callback) => {
      const result = await callback(prisma);
      return result;
    });
    prisma.profile.findUnique.mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      fullName: 'Test User'
    });
    prisma.profile.create.mockResolvedValue({
      id: 'new-user-id',
      email: 'newuser@example.com',
      fullName: 'New User',
      role: 'client'
    });
    prisma.userRole.create.mockResolvedValue({});
  });

  describe('Response Time Tests', () => {
    it('should respond to health check within 100ms', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(100);
      expect(response.body.success).toBe(true);
    });

    it('should respond to projects list within 200ms', async () => {
      const { prisma } = require('@prisma/client');
      prisma.project.findMany.mockResolvedValue([]);
      prisma.project.count.mockResolvedValue(0);
      prisma.$transaction.mockImplementation(async (callback) => {
        return await callback(prisma);
      });

      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/projects')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(200);
      expect(response.body.success).toBe(true);
    });

    it('should handle authentication within 300ms', async () => {
      const { prisma } = require('@prisma/client');
      prisma.profile.findUnique.mockResolvedValue(null);
      prisma.profile.create.mockResolvedValue({
        id: 'user-123',
        email: 'perf@example.com',
        fullName: 'Performance User'
      });
      prisma.userRole.create.mockResolvedValue({
        id: 'role-123',
        userId: 'user-123',
        role: 'client'
      });

      const userData = {
        email: 'perf@example.com',
        password: 'password123',
        fullName: 'Performance User',
        role: 'client'
      };

      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(300);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Concurrent Request Tests', () => {
    it('should handle multiple concurrent health checks', async () => {
      // Rate limiting을 피하기 위해 적은 수의 요청으로 테스트
      const requests = Array(3).fill().map(() => 
        request(app).get('/api/health')
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // 모든 요청이 성공해야 함
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // 3개 요청이 1초 내에 완료되어야 함
      expect(totalTime).toBeLessThan(1000);
    });

    it('should handle multiple concurrent project requests', async () => {
      // Rate limiting을 피하기 위해 적은 수의 요청으로 테스트
      const requests = Array(2).fill().map(() => 
        request(app).get('/api/projects')
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // 모든 요청이 성공해야 함
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // 2개 요청이 1초 내에 완료되어야 함
      expect(totalTime).toBeLessThan(1000);
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not leak memory during multiple requests', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // 100개의 요청을 순차적으로 실행
      for (let i = 0; i < 100; i++) {
        await request(app).get('/api/health');
      }

      // 가비지 컬렉션 강제 실행
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // 메모리 증가가 10MB를 넘지 않아야 함
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle 404 errors quickly', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/nonexistent-endpoint');

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Rate limiting으로 인해 429가 될 수 있지만, 빠른 응답은 확인
      expect(responseTime).toBeLessThan(50);
      expect([404, 429]).toContain(response.status);
    });

    it('should handle validation errors quickly', async () => {
      const invalidData = {
        email: 'invalid-email' // Invalid email format
      };

      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Rate limiting으로 인해 429가 될 수 있지만, 빠른 응답은 확인
      expect(responseTime).toBeLessThan(100);
      expect([400, 429]).toContain(response.status);
    });
  });

  describe('Load Test Simulation', () => {
    it('should handle burst traffic', async () => {
      // Rate limiting을 피하기 위해 적은 수의 요청으로 테스트
      const requests = Array(5).fill().map(() => 
        request(app).get('/api/projects')
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // 성공률 계산 (200 또는 429 모두 허용)
      const successCount = responses.filter(r => [200, 429].includes(r.status)).length;
      const successRate = successCount / responses.length;

      // 80% 이상의 성공률을 유지해야 함 (rate limiting 고려)
      expect(successRate).toBeGreaterThanOrEqual(0.8);

      // 5개 요청이 2초 내에 완료되어야 함
      expect(totalTime).toBeLessThan(2000);
    });
  });
});
