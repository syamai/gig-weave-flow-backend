const express = require('express');
const { prisma } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validate, messageValidation } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// 메시지 전송
const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, projectId, content } = req.body;
  const senderId = req.user.id;

  // 수신자 존재 확인
  const receiver = await prisma.profile.findUnique({
    where: { id: receiverId }
  });

  if (!receiver) {
    return res.status(404).json({
      success: false,
      message: 'Receiver not found'
    });
  }

  // 프로젝트 확인 (선택사항)
  if (projectId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
  }

  const message = await prisma.message.create({
    data: {
      senderId,
      receiverId,
      projectId,
      content
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

  // Socket.io로 실시간 메시지 전송
  const io = req.app.get('io');
  if (io) {
    io.to(`user_${receiverId}`).emit('receive_message', {
      id: message.id,
      senderId: message.senderId,
      receiverId: message.receiverId,
      projectId: message.projectId,
      content: message.content,
      read: message.read,
      createdAt: message.createdAt,
      sender: message.sender
    });
  }

  res.status(201).json({
    success: true,
    message: 'Message sent successfully',
    data: { message }
  });
});

// 메시지 목록 조회
const getMessages = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    projectId,
    userId
  } = req.query;

  const skip = (page - 1) * limit;
  const take = parseInt(limit);
  const currentUserId = req.user.id;

  let where = {
    OR: [
      { senderId: currentUserId },
      { receiverId: currentUserId }
    ]
  };

  // 특정 사용자와의 대화
  if (userId) {
    where = {
      OR: [
        {
          senderId: currentUserId,
          receiverId: userId
        },
        {
          senderId: userId,
          receiverId: currentUserId
        }
      ]
    };
  }

  // 특정 프로젝트의 메시지
  if (projectId) {
    where.projectId = projectId;
  }

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true
          }
        },
        receiver: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true
          }
        }
      }
    }),
    prisma.message.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      messages,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        pages: Math.ceil(total / take)
      }
    }
  });
});

// 메시지 읽음 처리
const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const message = await prisma.message.findFirst({
    where: {
      id,
      receiverId: userId
    }
  });

  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Message not found'
    });
  }

  const updatedMessage = await prisma.message.update({
    where: { id },
    data: { read: true }
  });

  res.json({
    success: true,
    message: 'Message marked as read',
    data: { message: updatedMessage }
  });
});

// 대화 목록 조회 (최근 메시지가 있는 사용자들)
const getConversations = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // 최근 메시지가 있는 대화 상대들 조회
  const conversations = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId },
        { receiverId: userId }
      ]
    },
    include: {
      sender: {
        select: {
          id: true,
          fullName: true,
          avatarUrl: true
        }
      },
      receiver: {
        select: {
          id: true,
          fullName: true,
          avatarUrl: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // 대화 상대별로 그룹화하고 최근 메시지만 유지
  const conversationMap = new Map();
  
  conversations.forEach(message => {
    const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
    const otherUser = message.senderId === userId ? message.receiver : message.sender;
    
    if (!conversationMap.has(otherUserId)) {
      conversationMap.set(otherUserId, {
        userId: otherUserId,
        user: otherUser,
        lastMessage: message,
        unreadCount: 0
      });
    }
  });

  // 읽지 않은 메시지 수 계산
  for (const [otherUserId, conversation] of conversationMap) {
    const unreadCount = await prisma.message.count({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        read: false
      }
    });
    conversation.unreadCount = unreadCount;
  }

  const conversationList = Array.from(conversationMap.values());

  res.json({
    success: true,
    data: { conversations: conversationList }
  });
});

// 읽지 않은 메시지 수 조회
const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const unreadCount = await prisma.message.count({
    where: {
      receiverId: userId,
      read: false
    }
  });

  res.json({
    success: true,
    data: { unreadCount }
  });
});

// 보호된 라우트
router.post('/', authenticateToken, validate(messageValidation.create), sendMessage);
router.get('/', authenticateToken, getMessages);
router.get('/conversations', authenticateToken, getConversations);
router.get('/unread-count', authenticateToken, getUnreadCount);
router.put('/:id/read', authenticateToken, markAsRead);

module.exports = router;
