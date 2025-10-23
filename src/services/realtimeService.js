const { prisma } = require('../config/database');

/**
 * 실시간 기능 서비스 (Supabase Realtime 대체)
 */
class RealtimeService {
  constructor(io) {
    this.io = io;
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.id}`);

      // 사용자 인증 및 방 참가
      socket.on('authenticate', async (data) => {
        try {
          const { userId, token } = data;
          
          // TODO: JWT 토큰 검증
          // const decoded = jwt.verify(token, process.env.JWT_SECRET);
          
          socket.userId = userId;
          socket.join(`user:${userId}`);
          
          console.log(`User ${userId} authenticated and joined room`);
          
          socket.emit('authenticated', { success: true });
        } catch (error) {
          console.error('Authentication error:', error);
          socket.emit('authentication_error', { message: 'Authentication failed' });
        }
      });

      // 메시지 구독
      socket.on('subscribe_messages', (data) => {
        const { userId } = data;
        if (socket.userId === userId) {
          socket.join(`messages:${userId}`);
          console.log(`User ${userId} subscribed to messages`);
        }
      });

      // 알림 구독
      socket.on('subscribe_notifications', (data) => {
        const { userId } = data;
        if (socket.userId === userId) {
          socket.join(`notifications:${userId}`);
          console.log(`User ${userId} subscribed to notifications`);
        }
      });

      // 프로젝트 구독
      socket.on('subscribe_project', (data) => {
        const { projectId } = data;
        socket.join(`project:${projectId}`);
        console.log(`User subscribed to project ${projectId}`);
      });

      // 연결 해제
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
      });
    });
  }

  // 메시지 실시간 전송
  async sendMessage(senderId, receiverId, message) {
    this.io.to(`messages:${receiverId}`).emit('new_message', {
      senderId,
      receiverId,
      message,
      timestamp: new Date().toISOString()
    });
  }

  // 알림 실시간 전송
  async sendNotification(userId, notification) {
    this.io.to(`notifications:${userId}`).emit('new_notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });
  }

  // 프로젝트 업데이트 알림
  async notifyProjectUpdate(projectId, updateType, data) {
    this.io.to(`project:${projectId}`).emit('project_update', {
      projectId,
      updateType,
      data,
      timestamp: new Date().toISOString()
    });
  }

  // 제안서 업데이트 알림
  async notifyProposalUpdate(proposalId, updateType, data) {
    this.io.to(`proposal:${proposalId}`).emit('proposal_update', {
      proposalId,
      updateType,
      data,
      timestamp: new Date().toISOString()
    });
  }

  // 계약 업데이트 알림
  async notifyContractUpdate(contractId, updateType, data) {
    this.io.to(`contract:${contractId}`).emit('contract_update', {
      contractId,
      updateType,
      data,
      timestamp: new Date().toISOString()
    });
  }

  // 데이터베이스 변경사항 감지 및 실시간 알림
  async handleDatabaseChange(table, event, newRecord, oldRecord) {
    switch (table) {
      case 'messages':
        await this.handleMessageChange(event, newRecord, oldRecord);
        break;
      case 'notifications':
        await this.handleNotificationChange(event, newRecord, oldRecord);
        break;
      case 'projects':
        await this.handleProjectChange(event, newRecord, oldRecord);
        break;
      case 'proposals':
        await this.handleProposalChange(event, newRecord, oldRecord);
        break;
      case 'contracts':
        await this.handleContractChange(event, newRecord, oldRecord);
        break;
    }
  }

  async handleMessageChange(event, newRecord, oldRecord) {
    if (event === 'INSERT' && newRecord) {
      await this.sendMessage(newRecord.senderId, newRecord.receiverId, {
        id: newRecord.id,
        content: newRecord.content,
        senderId: newRecord.senderId,
        receiverId: newRecord.receiverId,
        projectId: newRecord.projectId,
        read: newRecord.read,
        createdAt: newRecord.createdAt
      });
    }
  }

  async handleNotificationChange(event, newRecord, oldRecord) {
    if (event === 'INSERT' && newRecord) {
      await this.sendNotification(newRecord.userId, {
        id: newRecord.id,
        title: newRecord.title,
        message: newRecord.message,
        type: newRecord.type,
        link: newRecord.link,
        read: newRecord.read
      });
    }
  }

  async handleProjectChange(event, newRecord, oldRecord) {
    if (event === 'INSERT' && newRecord) {
      // 새 프로젝트 생성 시 모든 파트너에게 알림
      await this.notifyProjectUpdate(newRecord.id, 'created', newRecord);
    } else if (event === 'UPDATE' && newRecord) {
      // 프로젝트 업데이트 시 관련자들에게 알림
      await this.notifyProjectUpdate(newRecord.id, 'updated', newRecord);
    }
  }

  async handleProposalChange(event, newRecord, oldRecord) {
    if (event === 'INSERT' && newRecord) {
      // 새 제안서 생성 시 클라이언트에게 알림
      await this.notifyProposalUpdate(newRecord.id, 'created', newRecord);
    } else if (event === 'UPDATE' && newRecord) {
      // 제안서 상태 변경 시 파트너에게 알림
      await this.notifyProposalUpdate(newRecord.id, 'updated', newRecord);
    }
  }

  async handleContractChange(event, newRecord, oldRecord) {
    if (event === 'INSERT' && newRecord) {
      // 새 계약 생성 시 파트너에게 알림
      await this.notifyContractUpdate(newRecord.id, 'created', newRecord);
    } else if (event === 'UPDATE' && newRecord) {
      // 계약 상태 변경 시 양방향 알림
      await this.notifyContractUpdate(newRecord.id, 'updated', newRecord);
    }
  }
}

module.exports = RealtimeService;
