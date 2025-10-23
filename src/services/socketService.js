const { prisma } = require('../config/database');
const { createNotification } = require('./notificationService');

/**
 * Socket.io 이벤트 핸들러 서비스
 */
class SocketService {
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

      // 메시지 전송
      socket.on('send_message', async (data) => {
        try {
          const { receiverId, content, projectId } = data;
          const senderId = socket.userId;

          if (!senderId) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
          }

          // 메시지 저장
          const message = await prisma.message.create({
            data: {
              senderId,
              receiverId,
              content,
              projectId: projectId || null
            },
            include: {
              sender: {
                select: {
                  id: true,
                  fullName: true,
                  avatarUrl: true
                }
              }
            }
          });

          // 수신자에게 실시간 메시지 전송
          this.io.to(`user:${receiverId}`).emit('new_message', message);

          // 알림 생성
          await createNotification({
            userId: receiverId,
            title: '새 메시지',
            message: `${message.sender.fullName}님이 메시지를 보냈습니다.`,
            type: 'new_message',
            link: '/messages'
          });

          // 알림 실시간 전송
          this.io.to(`user:${receiverId}`).emit('new_notification', {
            title: '새 메시지',
            message: `${message.sender.fullName}님이 메시지를 보냈습니다.`,
            type: 'new_message'
          });

          socket.emit('message_sent', { success: true, messageId: message.id });
        } catch (error) {
          console.error('Send message error:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // 메시지 읽음 처리
      socket.on('mark_message_read', async (data) => {
        try {
          const { messageId } = data;
          const userId = socket.userId;

          if (!userId) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
          }

          await prisma.message.update({
            where: { id: messageId },
            data: { read: true }
          });

          socket.emit('message_marked_read', { messageId });
        } catch (error) {
          console.error('Mark message read error:', error);
          socket.emit('error', { message: 'Failed to mark message as read' });
        }
      });

      // 프로젝트 상태 변경 알림
      socket.on('project_status_changed', async (data) => {
        try {
          const { projectId, newStatus, userId } = data;

          // 관련 사용자들에게 알림
          this.io.to(`user:${userId}`).emit('project_status_update', {
            projectId,
            newStatus
          });
        } catch (error) {
          console.error('Project status change error:', error);
        }
      });

      // 제안서 상태 변경 알림
      socket.on('proposal_status_changed', async (data) => {
        try {
          const { proposalId, newStatus, partnerId } = data;

          // 파트너에게 알림
          this.io.to(`user:${partnerId}`).emit('proposal_status_update', {
            proposalId,
            newStatus
          });
        } catch (error) {
          console.error('Proposal status change error:', error);
        }
      });

      // 계약 상태 변경 알림
      socket.on('contract_status_changed', async (data) => {
        try {
          const { contractId, newStatus, clientId, partnerId } = data;

          // 클라이언트와 파트너 모두에게 알림
          this.io.to(`user:${clientId}`).emit('contract_status_update', {
            contractId,
            newStatus
          });
          
          this.io.to(`user:${partnerId}`).emit('contract_status_update', {
            contractId,
            newStatus
          });
        } catch (error) {
          console.error('Contract status change error:', error);
        }
      });

      // 연결 해제
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
      });
    });
  }

  // 알림 전송 (서버에서 직접 호출)
  async sendNotification(userId, notification) {
    this.io.to(`user:${userId}`).emit('new_notification', notification);
  }

  // 프로젝트 생성 알림
  async notifyProjectCreated(projectId, clientId) {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          projectTechStacks: {
            include: {
              techStack: true
            }
          }
        }
      });

      if (!project) return;

      // 모든 파트너에게 알림
      const partners = await prisma.partnerProfile.findMany({
        where: { available: true },
        include: { profile: true }
      });

      for (const partner of partners) {
        const notification = {
          title: '새 프로젝트가 등록되었습니다',
          message: `"${project.title}" 프로젝트가 등록되었습니다.`,
          type: 'project_created',
          link: `/projects/${projectId}`
        };

        // 알림 저장
        await createNotification({
          userId: partner.userId,
          ...notification
        });

        // 실시간 알림 전송
        this.sendNotification(partner.userId, notification);
      }
    } catch (error) {
      console.error('Notify project created error:', error);
    }
  }

  // 제안서 제출 알림
  async notifyProposalSubmitted(proposalId, clientId) {
    try {
      const proposal = await prisma.proposal.findUnique({
        where: { id: proposalId },
        include: {
          project: true,
          partnerProfile: {
            include: { profile: true }
          }
        }
      });

      if (!proposal) return;

      const notification = {
        title: '새 제안서가 제출되었습니다',
        message: `"${proposal.project.title}" 프로젝트에 새 제안서가 제출되었습니다.`,
        type: 'proposal_submitted',
        link: `/projects/${proposal.projectId}`
      };

      // 알림 저장
      await createNotification({
        userId: clientId,
        ...notification
      });

      // 실시간 알림 전송
      this.sendNotification(clientId, notification);
    } catch (error) {
      console.error('Notify proposal submitted error:', error);
    }
  }

  // 계약 생성 알림
  async notifyContractCreated(contractId, partnerId) {
    try {
      const contract = await prisma.contract.findUnique({
        where: { id: contractId },
        include: {
          project: true
        }
      });

      if (!contract) return;

      const notification = {
        title: '새 계약이 생성되었습니다',
        message: `"${contract.project.title}" 프로젝트의 계약이 생성되었습니다.`,
        type: 'contract_created',
        link: `/contracts/${contractId}`
      };

      // 알림 저장
      await createNotification({
        userId: partnerId,
        ...notification
      });

      // 실시간 알림 전송
      this.sendNotification(partnerId, notification);
    } catch (error) {
      console.error('Notify contract created error:', error);
    }
  }
}

module.exports = SocketService;
