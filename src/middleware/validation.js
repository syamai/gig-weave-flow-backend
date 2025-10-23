const Joi = require('joi');

// 공통 validation 스키마
const commonSchemas = {
  id: Joi.string().uuid().required(),
  optionalId: Joi.string().uuid().optional(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  fullName: Joi.string().min(2).max(100).required(),
  role: Joi.string().valid('client', 'partner', 'admin').required(),
  status: Joi.string().valid('open', 'in_progress', 'completed', 'cancelled').optional(),
  projectType: Joi.string().valid('fixed', 'hourly').required(),
  budget: Joi.number().positive().required(),
  rating: Joi.number().integer().min(1).max(5).required()
};

// 인증 관련 validation
const authValidation = {
  register: Joi.object({
    email: commonSchemas.email,
    password: commonSchemas.password,
    fullName: commonSchemas.fullName,
    role: commonSchemas.role
  }),
  
  login: Joi.object({
    email: commonSchemas.email,
    password: commonSchemas.password
  }),
  
  changePassword: Joi.object({
    currentPassword: commonSchemas.password,
    newPassword: commonSchemas.password
  })
};

// 프로젝트 관련 validation
const projectValidation = {
  create: Joi.object({
    title: Joi.string().min(5).max(200).required(),
    description: Joi.string().min(10).max(2000).required(),
    projectType: commonSchemas.projectType,
    budgetMin: commonSchemas.budget,
    budgetMax: commonSchemas.budget,
    durationWeeks: Joi.number().integer().min(1).max(104).optional(),
    techStackIds: Joi.array().items(commonSchemas.optionalId).optional()
  }),
  
  update: Joi.object({
    title: Joi.string().min(5).max(200).optional(),
    description: Joi.string().min(10).max(2000).optional(),
    projectType: commonSchemas.projectType.optional(),
    budgetMin: commonSchemas.budget.optional(),
    budgetMax: commonSchemas.budget.optional(),
    durationWeeks: Joi.number().integer().min(1).max(104).optional(),
    status: commonSchemas.status,
    techStackIds: Joi.array().items(commonSchemas.optionalId).optional()
  })
};

// 사용자 관련 validation
const userValidation = {
  updateProfile: Joi.object({
    fullName: commonSchemas.fullName.optional(),
    bio: Joi.string().max(500).optional(),
    location: Joi.string().max(100).optional(),
    website: Joi.string().uri().optional(),
    phone: Joi.string().max(20).optional()
  })
};

// 리뷰 관련 validation
const reviewValidation = {
  create: Joi.object({
    contractId: commonSchemas.id,
    revieweeId: commonSchemas.id,
    rating: commonSchemas.rating,
    comment: Joi.string().min(10).max(1000).required()
  }),
  
  update: Joi.object({
    rating: commonSchemas.rating.optional(),
    comment: Joi.string().min(10).max(1000).optional()
  })
};

// 실시간 관련 validation
const realtimeValidation = {
  subscribe: Joi.object({
    channel: Joi.string().min(1).max(100).required(),
    event: Joi.string().valid('INSERT', 'UPDATE', 'DELETE', '*').required(),
    table: Joi.string().min(1).max(100).required()
  }),
  
  unsubscribe: Joi.object({
    subscriptionId: commonSchemas.id
  }),
  
  postgresChanges: Joi.object({
    channel: Joi.string().min(1).max(100).required(),
    table: Joi.string().min(1).max(100).required(),
    event: Joi.string().valid('INSERT', 'UPDATE', 'DELETE', '*').default('*'),
    filter: Joi.string().max(500).optional()
  })
};

// 채널 관련 validation
const channelValidation = {
  create: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(500).optional()
  }),
  
  subscribe: Joi.object({
    channelId: commonSchemas.id
  }),
  
  unsubscribe: Joi.object({
    channelId: commonSchemas.id
  })
};

// 파트너 프로필 관련 validation
const partnerProfileValidation = {
  create: Joi.object({
    bio: Joi.string().max(1000).optional(),
    hourlyRate: Joi.number().positive().optional(),
    availability: Joi.string().valid('available', 'busy', 'unavailable').optional(),
    experience: Joi.number().integer().min(0).max(50).optional(),
    location: Joi.string().max(100).optional(),
    website: Joi.string().uri().optional(),
    linkedin: Joi.string().uri().optional(),
    github: Joi.string().uri().optional(),
    techStackIds: Joi.array().items(commonSchemas.optionalId).optional()
  }),
  
  update: Joi.object({
    bio: Joi.string().max(1000).optional(),
    hourlyRate: Joi.number().positive().optional(),
    availability: Joi.string().valid('available', 'busy', 'unavailable').optional(),
    experience: Joi.number().integer().min(0).max(50).optional(),
    location: Joi.string().max(100).optional(),
    website: Joi.string().uri().optional(),
    linkedin: Joi.string().uri().optional(),
    github: Joi.string().uri().optional(),
    techStackIds: Joi.array().items(commonSchemas.optionalId).optional()
  })
};

// 제안서 관련 validation
const proposalValidation = {
  create: Joi.object({
    projectId: commonSchemas.id,
    coverLetter: Joi.string().min(10).max(2000).required(),
    proposedRate: commonSchemas.budget,
    estimatedDurationWeeks: Joi.number().integer().min(1).max(104).optional(),
    portfolioLinks: Joi.array().items(Joi.string().uri()).optional()
  }),
  
  update: Joi.object({
    coverLetter: Joi.string().min(10).max(2000).optional(),
    proposedRate: commonSchemas.budget.optional(),
    estimatedDurationWeeks: Joi.number().integer().min(1).max(104).optional(),
    portfolioLinks: Joi.array().items(Joi.string().uri()).optional(),
    status: Joi.string().valid('pending', 'accepted', 'rejected', 'withdrawn').optional()
  })
};

// 메시지 관련 validation
const messageValidation = {
  create: Joi.object({
    recipientId: commonSchemas.id,
    content: Joi.string().min(1).max(2000).required(),
    messageType: Joi.string().valid('text', 'image', 'file').default('text')
  })
};

// 파일 업로드 관련 validation
const uploadValidation = {
  profileImage: Joi.object({
    // multer에서 처리하므로 추가 validation 없음
  }),
  
  portfolioImages: Joi.object({
    // multer에서 처리하므로 추가 validation 없음
  })
};

// validation 미들웨어
const validate = (schema) => {
  return (req, res, next) => {
    // schema가 undefined인 경우 에러 처리
    if (!schema) {
      console.error('Validation schema is undefined');
      return res.status(500).json({ 
        success: false, 
        message: 'Validation schema not found' 
      });
    }
    
    const { error, value } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true 
    });
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errorMessage
      });
    }
    
    req.body = value;
    next();
  };
};

module.exports = {
  validate,
  authValidation,
  projectValidation,
  userValidation,
  reviewValidation,
  realtimeValidation,
  channelValidation,
  partnerProfileValidation,
  proposalValidation,
  messageValidation,
  uploadValidation,
  commonSchemas
};