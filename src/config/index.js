require('dotenv').config();

const config = {
  // Server
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  databaseUrl: process.env.DATABASE_URL,
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // CORS
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8080',
  
  // File Upload
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB
  
  // Socket.io
  socketCorsOrigin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:8080',
  
  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  
  // Email (Optional)
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  }
};

// Validation
if (!config.databaseUrl) {
  console.warn('⚠️  DATABASE_URL is not set, using fallback for development');
  config.databaseUrl = 'postgresql://postgres:Tqnrkdl1007@db.xmeuypaqqtqcvkryygjo.supabase.co:5432/postgres';
}

if (config.nodeEnv === 'production' && config.jwtSecret === 'fallback-secret-key') {
  throw new Error('JWT_SECRET must be set in production');
}

module.exports = config;
