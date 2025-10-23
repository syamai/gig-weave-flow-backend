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

describe('Projects API', () => {
  let client, partner, clientToken, partnerToken;

  beforeEach(async () => {
    // 테스트 데이터 정리
    await testUtils.cleanupTestData();
    
    // 클라이언트 사용자 생성
    client = await testUtils.createTestUser({
      email: 'client@example.com',
      fullName: 'Client User',
      role: 'client'
    });
        clientToken = 'valid-token';

    // 파트너 사용자 생성
    partner = await testUtils.createTestUser({
      email: 'partner@example.com',
      fullName: 'Partner User',
      role: 'partner'
    });
        partnerToken = 'valid-token';
  });

  afterEach(async () => {
    // 테스트 후 데이터 정리
    await testUtils.cleanupTestData();
  });

  describe('GET /api/projects', () => {
    it('should get projects list without authentication', async () => {
      const response = await request(app)
        .get('/api/projects')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.projects)).toBe(true);
    });

    it('should filter projects by status', async () => {
      const response = await request(app)
        .get('/api/projects?status=open')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should paginate projects', async () => {
      const response = await request(app)
        .get('/api/projects?page=1&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
    });
  });

  describe('POST /api/projects', () => {
    it('should create a new project with valid data', async () => {
      const projectData = {
        title: 'Test Project',
        description: 'Test project description',
        projectType: 'fixed',
        budgetMin: 1000,
        budgetMax: 5000,
        durationWeeks: 4
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(projectData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.project.title).toBe(projectData.title);
      expect(response.body.data.project.clientId).toBe('user-123');
    });

    it('should return 400 for missing required fields', async () => {
      const projectData = {
        title: 'Test Project'
        // description 누락
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(projectData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const projectData = {
        title: 'Test Project',
        description: 'Test project description'
      };

      const response = await request(app)
        .post('/api/projects')
        .send(projectData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/projects/:id', () => {
    let project;

    beforeEach(async () => {
      // 테스트 프로젝트 생성
      project = await testUtils.prisma.project.create({
        data: {
          clientId: 'user-123', // Mock된 사용자 ID와 일치
          title: 'Test Project',
          description: 'Test project description',
          projectType: 'fixed',
          budgetMin: 1000,
          budgetMax: 5000,
          status: 'open'
        }
      });
    });

    it('should get project by id', async () => {
      const response = await request(app)
        .get(`/api/projects/${project.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.project.id).toBe(project.id);
      expect(response.body.data.project.title).toBe(project.title);
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .get('/api/projects/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/projects/:id', () => {
    let project;

    beforeEach(async () => {
      project = await testUtils.prisma.project.create({
        data: {
          clientId: 'user-123', // Mock된 사용자 ID와 일치
          title: 'Test Project',
          description: 'Test project description',
          projectType: 'fixed',
          status: 'open'
        }
      });
    });

    it('should update project with valid data', async () => {
      const updateData = {
        title: 'Updated Project',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/projects/${project.id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.project.title).toBe(updateData.title);
    });

    it('should return 403 for non-owner', async () => {
      // 파트너가 다른 사용자 ID로 프로젝트를 생성
      const partnerProject = await testUtils.prisma.project.create({
        data: {
          clientId: 'partner-user-id', // 다른 사용자 ID
          title: 'Partner Project',
          description: 'Partner project description',
          projectType: 'fixed',
          status: 'open'
        }
      });

      const updateData = {
        title: 'Updated Project'
      };

      const response = await request(app)
        .put(`/api/projects/${partnerProject.id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    let project;

    beforeEach(async () => {
      project = await testUtils.prisma.project.create({
        data: {
          clientId: 'user-123', // Mock된 사용자 ID와 일치
          title: 'Test Project',
          description: 'Test project description',
          projectType: 'fixed',
          status: 'open'
        }
      });
    });

    it('should delete project', async () => {
      const response = await request(app)
        .delete(`/api/projects/${project.id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 403 for non-owner', async () => {
      // 파트너가 다른 사용자 ID로 프로젝트를 생성
      const partnerProject = await testUtils.prisma.project.create({
        data: {
          clientId: 'partner-user-id', // 다른 사용자 ID
          title: 'Partner Project',
          description: 'Partner project description',
          projectType: 'fixed',
          status: 'open'
        }
      });

      const response = await request(app)
        .delete(`/api/projects/${partnerProject.id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/projects/my/projects', () => {
    beforeEach(async () => {
      // 클라이언트의 프로젝트들 생성
      await testUtils.prisma.project.createMany({
        data: [
          {
            clientId: 'user-123', // Mock된 사용자 ID와 일치
            title: 'Project 1',
            description: 'Description 1',
            projectType: 'fixed',
            status: 'open'
          },
          {
            clientId: 'user-123', // Mock된 사용자 ID와 일치
            title: 'Project 2',
            description: 'Description 2',
            projectType: 'hourly',
            status: 'in_progress'
          }
        ]
      });
    });

    it('should get user projects', async () => {
      const response = await request(app)
        .get('/api/projects/my/projects')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.projects).toHaveLength(2);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/projects/my/projects?status=open')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.projects).toHaveLength(1);
    });
  });
});
