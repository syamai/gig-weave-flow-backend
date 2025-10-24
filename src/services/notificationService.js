const { supabase } = require('../config/database');

/**
 * 알림 생성 서비스
 * @param {Object} notificationData - 알림 데이터
 * @param {string} notificationData.userId - 사용자 ID
 * @param {string} notificationData.title - 알림 제목
 * @param {string} notificationData.message - 알림 메시지
 * @param {string} notificationData.type - 알림 타입
 * @param {string} [notificationData.link] - 링크 (선택사항)
 * @returns {Promise<Object>} 생성된 알림
 */
const createNotification = async (notificationData) => {
  const { userId, title, message, type, link } = notificationData;

  const { data: notification, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title,
      message,
      type,
      link
    })
    .select()
    .single();

  if (error) {
    throw new Error('Failed to create notification');
  }

  return notification;
};

/**
 * 프로젝트 관련 알림 생성
 * @param {string} projectId - 프로젝트 ID
 * @param {string} type - 알림 타입
 * @param {Object} additionalData - 추가 데이터
 */
const createProjectNotification = async (projectId, type, additionalData = {}) => {
  const project = await supabaseproject.findUnique({
    where: { id: projectId },
    include: {
      projectTechStacks: {
        include: {
          techStack: true
        }
      }
    }
  });

  if (!project) {
    throw new Error('Project not found');
  }

  const notifications = [];

  switch (type) {
    case 'project_created':
      // 파트너들에게 새 프로젝트 알림
      const partners = await supabasepartnerProfile.findMany({
        where: { available: true },
        include: { profile: true }
      });

      for (const partner of partners) {
        const notification = await createNotification({
          userId: partner.userId,
          title: '새 프로젝트가 등록되었습니다',
          message: `"${project.title}" 프로젝트가 등록되었습니다.`,
          type: 'project_created',
          link: `/projects/${projectId}`
        });
        notifications.push(notification);
      }
      break;

    case 'project_updated':
      // 제안서를 제출한 파트너들에게 알림
      const proposals = await supabaseproposal.findMany({
        where: { projectId },
        include: { partnerProfile: true }
      });

      for (const proposal of proposals) {
        const notification = await createNotification({
          userId: proposal.partnerProfile.userId,
          title: '프로젝트가 수정되었습니다',
          message: `"${project.title}" 프로젝트가 수정되었습니다.`,
          type: 'project_updated',
          link: `/projects/${projectId}`
        });
        notifications.push(notification);
      }
      break;

    case 'project_cancelled':
      // 제안서를 제출한 파트너들에게 알림
      const cancelledProposals = await supabaseproposal.findMany({
        where: { projectId },
        include: { partnerProfile: true }
      });

      for (const proposal of cancelledProposals) {
        const notification = await createNotification({
          userId: proposal.partnerProfile.userId,
          title: '프로젝트가 취소되었습니다',
          message: `"${project.title}" 프로젝트가 취소되었습니다.`,
          type: 'project_cancelled',
          link: `/projects/${projectId}`
        });
        notifications.push(notification);
      }
      break;
  }

  return notifications;
};

/**
 * 제안서 관련 알림 생성
 * @param {string} proposalId - 제안서 ID
 * @param {string} type - 알림 타입
 * @param {Object} additionalData - 추가 데이터
 */
const createProposalNotification = async (proposalId, type, additionalData = {}) => {
  const proposal = await supabaseproposal.findUnique({
    where: { id: proposalId },
    include: {
      project: true,
      partnerProfile: {
        include: { profile: true }
      }
    }
  });

  if (!proposal) {
    throw new Error('Proposal not found');
  }

  const notifications = [];

  switch (type) {
    case 'proposal_submitted':
      // 클라이언트에게 새 제안서 알림
      const notification = await createNotification({
        userId: proposal.project.clientId,
        title: '새 제안서가 제출되었습니다',
        message: `"${proposal.project.title}" 프로젝트에 새 제안서가 제출되었습니다.`,
        type: 'proposal_submitted',
        link: `/projects/${proposal.projectId}`
      });
      notifications.push(notification);
      break;

    case 'proposal_accepted':
      // 파트너에게 제안서 승인 알림
      const acceptedNotification = await createNotification({
        userId: proposal.partnerProfile.userId,
        title: '제안서가 승인되었습니다',
        message: `"${proposal.project.title}" 프로젝트의 제안서가 승인되었습니다.`,
        type: 'proposal_accepted',
        link: `/proposals/${proposalId}`
      });
      notifications.push(acceptedNotification);
      break;

    case 'proposal_rejected':
      // 파트너에게 제안서 거절 알림
      const rejectedNotification = await createNotification({
        userId: proposal.partnerProfile.userId,
        title: '제안서가 거절되었습니다',
        message: `"${proposal.project.title}" 프로젝트의 제안서가 거절되었습니다.`,
        type: 'proposal_rejected',
        link: `/proposals/${proposalId}`
      });
      notifications.push(rejectedNotification);
      break;
  }

  return notifications;
};

/**
 * 계약 관련 알림 생성
 * @param {string} contractId - 계약 ID
 * @param {string} type - 알림 타입
 * @param {Object} additionalData - 추가 데이터
 */
const createContractNotification = async (contractId, type, additionalData = {}) => {
  const contract = await supabasecontract.findUnique({
    where: { id: contractId },
    include: {
      project: true,
      partnerProfile: {
        include: { profile: true }
      }
    }
  });

  if (!contract) {
    throw new Error('Contract not found');
  }

  const notifications = [];

  switch (type) {
    case 'contract_created':
      // 파트너에게 계약 생성 알림
      const partnerNotification = await createNotification({
        userId: contract.partnerProfile.userId,
        title: '새 계약이 생성되었습니다',
        message: `"${contract.project.title}" 프로젝트의 계약이 생성되었습니다.`,
        type: 'contract_created',
        link: `/contracts/${contractId}`
      });
      notifications.push(partnerNotification);
      break;

    case 'contract_started':
      // 양방향 알림
      const clientStartNotification = await createNotification({
        userId: contract.project.clientId,
        title: '계약이 시작되었습니다',
        message: `"${contract.project.title}" 프로젝트의 계약이 시작되었습니다.`,
        type: 'contract_started',
        link: `/contracts/${contractId}`
      });

      const partnerStartNotification = await createNotification({
        userId: contract.partnerProfile.userId,
        title: '계약이 시작되었습니다',
        message: `"${contract.project.title}" 프로젝트의 계약이 시작되었습니다.`,
        type: 'contract_started',
        link: `/contracts/${contractId}`
      });

      notifications.push(clientStartNotification, partnerStartNotification);
      break;

    case 'contract_completed':
      // 양방향 알림
      const clientCompleteNotification = await createNotification({
        userId: contract.project.clientId,
        title: '계약이 완료되었습니다',
        message: `"${contract.project.title}" 프로젝트의 계약이 완료되었습니다.`,
        type: 'contract_completed',
        link: `/contracts/${contractId}`
      });

      const partnerCompleteNotification = await createNotification({
        userId: contract.partnerProfile.userId,
        title: '계약이 완료되었습니다',
        message: `"${contract.project.title}" 프로젝트의 계약이 완료되었습니다.`,
        type: 'contract_completed',
        link: `/contracts/${contractId}`
      });

      notifications.push(clientCompleteNotification, partnerCompleteNotification);
      break;
  }

  return notifications;
};

/**
 * 메시지 관련 알림 생성
 * @param {string} messageId - 메시지 ID
 * @param {string} type - 알림 타입
 * @param {Object} additionalData - 추가 데이터
 */
const createMessageNotification = async (messageId, type, additionalData = {}) => {
  const message = await supabasemessage.findUnique({
    where: { id: messageId },
    include: {
      sender: {
        select: { fullName: true }
      }
    }
  });

  if (!message) {
    throw new Error('Message not found');
  }

  const notification = await createNotification({
    userId: message.receiverId,
    title: '새 메시지가 도착했습니다',
    message: `${message.sender.fullName}님이 메시지를 보냈습니다.`,
    type: 'new_message',
    link: `/messages`
  });

  return [notification];
};

/**
 * 리뷰 관련 알림 생성
 * @param {string} reviewId - 리뷰 ID
 * @param {string} type - 알림 타입
 * @param {Object} additionalData - 추가 데이터
 */
const createReviewNotification = async (reviewId, type, additionalData = {}) => {
  const review = await supabasereview.findUnique({
    where: { id: reviewId },
    include: {
      reviewer: {
        select: { fullName: true }
      },
      contract: {
        include: {
          project: {
            select: { title: true }
          }
        }
      }
    }
  });

  if (!review) {
    throw new Error('Review not found');
  }

  const notification = await createNotification({
    userId: review.revieweeId,
    title: '새 리뷰가 작성되었습니다',
    message: `${review.reviewer.fullName}님이 "${review.contract.project.title}" 프로젝트에 리뷰를 작성했습니다.`,
    type: 'new_review',
    link: `/reviews`
  });

  return [notification];
};

/**
 * 시스템 알림 생성
 * @param {string} userId - 사용자 ID
 * @param {string} title - 알림 제목
 * @param {string} message - 알림 메시지
 * @param {string} [link] - 링크
 */
const createSystemNotification = async (userId, title, message, link = null) => {
  const notification = await createNotification({
    userId,
    title,
    message,
    type: 'system',
    link
  });

  return notification;
};

module.exports = {
  createNotification,
  createProjectNotification,
  createProposalNotification,
  createContractNotification,
  createMessageNotification,
  createReviewNotification,
  createSystemNotification
};
