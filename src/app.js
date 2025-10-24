const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

const config = require('./config');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// 라우트 임포트
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const partnerRoutes = require('./routes/partners');
const proposalRoutes = require('./routes/proposals');
const contractRoutes = require('./routes/contracts');
const messageRoutes = require('./routes/messages');
const techStackRoutes = require('./routes/techStacks');
const notificationRoutes = require('./routes/notifications');
const uploadRoutes = require('./routes/upload');
const reviewRoutes = require('./routes/reviews');
const analyticsRoutes = require('./routes/analytics');
const rpcRoutes = require('./routes/rpc');
const storageRoutes = require('./routes/storage');
const profileRoutes = require('./routes/profiles');
const realtimeRoutes = require('./routes/realtime');
const channelRoutes = require('./routes/channels');

const app = express();

// 보안 미들웨어
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS 설정
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 압축 미들웨어
app.use(compression());

// 로깅 미들웨어
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing 미들웨어
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 정적 파일 서빙 (업로드된 파일)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Swagger API 문서
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpecs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Gig Weave Flow API Documentation'
}));

// Swagger JSON 엔드포인트
app.get('/api-docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpecs);
});

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: 서버 상태 확인
 *     tags: [System]
 *     responses:
 *       200:
 *         description: 서버가 정상적으로 실행 중
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *                           description: 현재 시간
 *                         environment:
 *                           type: string
 *                           description: 실행 환경 (development/production)
 */
// Health check 엔드포인트
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

// API 라우트
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/tech-stacks', techStackRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/rpc', rpcRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/realtime', realtimeRoutes);
app.use('/api/channels', channelRoutes);

// 404 에러 처리
app.use(notFound);

// 에러 처리 미들웨어
app.use(errorHandler);

module.exports = app;
