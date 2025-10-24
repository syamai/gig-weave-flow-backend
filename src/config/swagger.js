const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./index');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Gig Weave Flow API',
      version: '1.0.0',
      description: '프리랜서 마켓플레이스 플랫폼 API 문서',
      contact: {
        name: 'Gig Weave Flow Team',
        email: 'support@gigweaveflow.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: config.nodeEnv === 'production' 
          ? 'https://gig-weave-flow-backend-production.up.railway.app' 
          : `http://localhost:${config.port}`,
        description: config.nodeEnv === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT 토큰을 사용한 인증'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: '사용자 고유 ID'
            },
            email: {
              type: 'string',
              format: 'email',
              description: '이메일 주소'
            },
            fullName: {
              type: 'string',
              description: '사용자 이름'
            },
            avatarUrl: {
              type: 'string',
              format: 'uri',
              description: '프로필 이미지 URL'
            },
            phone: {
              type: 'string',
              description: '전화번호'
            },
            role: {
              type: 'string',
              enum: ['client', 'partner', 'admin'],
              description: '사용자 역할'
            }
          }
        },
        Project: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: '프로젝트 고유 ID'
            },
            title: {
              type: 'string',
              description: '프로젝트 제목'
            },
            description: {
              type: 'string',
              description: '프로젝트 설명'
            },
            projectType: {
              type: 'string',
              enum: ['fixed', 'hourly'],
              description: '프로젝트 유형'
            },
            budgetMin: {
              type: 'number',
              description: '최소 예산'
            },
            budgetMax: {
              type: 'number',
              description: '최대 예산'
            },
            durationWeeks: {
              type: 'integer',
              description: '예상 기간 (주)'
            },
            status: {
              type: 'string',
              enum: ['draft', 'open', 'in_progress', 'completed', 'cancelled'],
              description: '프로젝트 상태'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '생성일시'
            }
          }
        },
        PartnerProfile: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: '파트너 프로필 ID'
            },
            bio: {
              type: 'string',
              description: '자기소개'
            },
            experienceYears: {
              type: 'integer',
              description: '경력 (년)'
            },
            hourlyRate: {
              type: 'number',
              description: '시간당 요금'
            },
            projectRate: {
              type: 'number',
              description: '프로젝트 기본 요금'
            },
            available: {
              type: 'boolean',
              description: '프로젝트 수주 가능 여부'
            }
          }
        },
        Proposal: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: '제안서 ID'
            },
            coverLetter: {
              type: 'string',
              description: '자기소개서'
            },
            proposedRate: {
              type: 'number',
              description: '제안 요금'
            },
            estimatedDurationWeeks: {
              type: 'integer',
              description: '예상 기간 (주)'
            },
            status: {
              type: 'string',
              enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
              description: '제안서 상태'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '생성일시'
            }
          }
        },
        Contract: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: '계약 ID'
            },
            agreedRate: {
              type: 'number',
              description: '합의된 요금'
            },
            startDate: {
              type: 'string',
              format: 'date-time',
              description: '시작일'
            },
            endDate: {
              type: 'string',
              format: 'date-time',
              description: '종료일'
            },
            status: {
              type: 'string',
              enum: ['active', 'completed', 'terminated'],
              description: '계약 상태'
            },
            terms: {
              type: 'string',
              description: '계약 조건'
            }
          }
        },
        Message: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: '메시지 ID'
            },
            content: {
              type: 'string',
              description: '메시지 내용'
            },
            read: {
              type: 'boolean',
              description: '읽음 여부'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '생성일시'
            }
          }
        },
        TechStack: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: '기술 스택 ID'
            },
            name: {
              type: 'string',
              description: '기술 스택 이름'
            },
            category: {
              type: 'string',
              description: '카테고리'
            }
          }
        },
        Review: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: '리뷰 ID'
            },
            contractId: {
              type: 'string',
              format: 'uuid',
              description: '계약 ID'
            },
            reviewerId: {
              type: 'string',
              format: 'uuid',
              description: '리뷰 작성자 ID'
            },
            revieweeId: {
              type: 'string',
              format: 'uuid',
              description: '리뷰 대상자 ID'
            },
            rating: {
              type: 'integer',
              minimum: 1,
              maximum: 5,
              description: '평점 (1-5)'
            },
            comment: {
              type: 'string',
              description: '리뷰 내용'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '생성일시'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: '에러 메시지'
            },
            errors: {
              type: 'string',
              description: '상세 에러 정보'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              description: '성공 메시지'
            },
            data: {
              type: 'object',
              description: '응답 데이터'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = specs;
