const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const { connectDB, disconnectDB } = require('./src/config/database');
const config = require('./src/config');
const SocketService = require('./src/services/socketService');
const RealtimeService = require('./src/services/realtimeService');

// HTTP 서버 생성
const server = http.createServer(app);

// Socket.io 설정
const io = new Server(server, {
  cors: {
    origin: config.socketCorsOrigin,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.io 서비스 초기화
const socketService = new SocketService(io);
const realtimeService = new RealtimeService(io);

// Socket.io 인스턴스를 app에 추가 (라우트에서 사용)
app.set('io', io);

// 서버 시작
const startServer = async () => {
  try {
    // 데이터베이스 연결
    await connectDB();
    
    // 서버 시작
    const PORT = config.port;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Frontend URL: ${config.frontendUrl}`);
      console.log(`🌍 Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  server.close(async () => {
    console.log('HTTP server closed');
    
    try {
      await disconnectDB();
      console.log('Database disconnected');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  });
};

// 시그널 처리
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 처리되지 않은 예외 처리
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// 서버 시작
startServer();
