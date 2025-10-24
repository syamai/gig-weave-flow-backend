const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// CORS 설정
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:3000',
  'https://gig-weave-flow-lfayfcu39-syamais-projects.vercel.app',
  'https://gig-weave-flow.vercel.app',
  'https://*.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // origin이 undefined인 경우 (같은 도메인에서의 요청) 허용
    if (!origin) return callback(null, true);
    
    // 허용된 origin 목록에 있는지 확인
    if (allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        return origin.endsWith(allowedOrigin.replace('*', ''));
      }
      return origin === allowedOrigin;
    })) {
      return callback(null, true);
    }
    
    // 개발 환경에서는 모든 origin 허용
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: 'development'
  });
});

// Test auth endpoint
app.post('/api/auth/register', (req, res) => {
  res.json({
    success: true,
    message: 'Registration endpoint working',
    data: req.body
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
  console.log(`📡 CORS enabled for Vercel domains`);
});
