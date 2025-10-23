# 📚 Gig Weave Flow API 문서

## 🚀 API 문서 접근

### 개발 환경
```
http://localhost:3001/api-docs
```

### 프로덕션 환경
```
https://your-railway-app.railway.app/api-docs
```

## 📋 API 개요

Gig Weave Flow는 프리랜서 마켓플레이스 플랫폼을 위한 RESTful API입니다.

### 기본 정보
- **Base URL**: `http://localhost:3001/api` (개발) / `https://your-railway-app.railway.app/api` (프로덕션)
- **Content-Type**: `application/json`
- **인증 방식**: JWT Bearer Token

### 응답 형식
모든 API 응답은 다음 형식을 따릅니다:

#### 성공 응답
```json
{
  "success": true,
  "message": "성공 메시지",
  "data": {
    // 응답 데이터
  }
}
```

#### 에러 응답
```json
{
  "success": false,
  "message": "에러 메시지",
  "errors": "상세 에러 정보 (선택사항)"
}
```

## 🔐 인증

### JWT 토큰 사용
API를 사용하려면 JWT 토큰이 필요합니다. 토큰은 다음 헤더에 포함해야 합니다:

```
Authorization: Bearer <your-jwt-token>
```

### 토큰 획득
1. **회원가입**: `POST /api/auth/register`
2. **로그인**: `POST /api/auth/login`

## 📊 주요 엔드포인트

**총 엔드포인트 수: 75개** (완전 구현)

**엔드포인트 분류:**
- 인증: 6개
- 프로젝트: 6개  
- 사용자: 3개
- 기술 스택: 3개
- 파일 업로드: 3개
- 알림: 6개
- 리뷰: 5개
- 분석/통계: 4개
- RPC 함수: 3개
- 파일 스토리지: 4개
- 실시간 기능: 4개
- 채널: 5개
- 프로필: 4개
- 메시지: 5개
- 파트너: 7개
- 제안서: 7개
- 계약: 5개
- 시스템: 1개

### 1. 인증 (Authentication) - 6개
| 메서드 | 엔드포인트 | 설명 | 인증 필요 |
|--------|------------|------|-----------|
| POST | `/api/auth/register` | 회원가입 | ❌ |
| POST | `/api/auth/login` | 로그인 | ❌ |
| GET | `/api/auth/me` | 현재 사용자 정보 | ✅ |
| POST | `/api/auth/logout` | 로그아웃 | ✅ |
| PUT | `/api/auth/change-password` | 비밀번호 변경 | ✅ |
| GET | `/api/auth/session` | 세션 확인 (Supabase 호환) | ✅ |

### 2. 프로젝트 (Projects) - 6개
| 메서드 | 엔드포인트 | 설명 | 인증 필요 | 권한 |
|--------|------------|------|-----------|------|
| GET | `/api/projects` | 프로젝트 목록 조회 | ❌ | - |
| GET | `/api/projects/:id` | 프로젝트 상세 조회 | ❌ | - |
| POST | `/api/projects` | 프로젝트 생성 | ✅ | Client |
| PUT | `/api/projects/:id` | 프로젝트 수정 | ✅ | Client |
| DELETE | `/api/projects/:id` | 프로젝트 삭제 | ✅ | Client |
| GET | `/api/projects/my/projects` | 내 프로젝트 목록 | ✅ | Client |

### 3. 사용자 (Users) - 3개
| 메서드 | 엔드포인트 | 설명 | 인증 필요 |
|--------|------------|------|-----------|
| GET | `/api/users/profile/:id` | 사용자 프로필 조회 | ❌ |
| PUT | `/api/users/profile` | 프로필 수정 | ✅ |
| GET | `/api/users/stats` | 사용자 통계 | ✅ |

### 4. 기술 스택 (Tech Stacks) - 3개
| 메서드 | 엔드포인트 | 설명 | 인증 필요 |
|--------|------------|------|-----------|
| GET | `/api/tech-stacks` | 기술 스택 목록 조회 | ❌ |
| GET | `/api/tech-stacks/categories` | 카테고리 목록 조회 | ❌ |
| GET | `/api/tech-stacks/:id` | 기술 스택 상세 조회 | ❌ |

### 5. 파일 업로드 (Upload) - 3개
| 메서드 | 엔드포인트 | 설명 | 인증 필요 |
|--------|------------|------|-----------|
| POST | `/api/upload/profile-image` | 프로필 이미지 업로드 | ✅ |
| POST | `/api/upload/portfolio-images` | 포트폴리오 이미지 업로드 | ✅ |
| DELETE | `/api/upload/:filename` | 파일 삭제 | ✅ |

### 6. 알림 (Notifications) - 6개
| 메서드 | 엔드포인트 | 설명 | 인증 필요 |
|--------|------------|------|-----------|
| GET | `/api/notifications` | 알림 목록 조회 | ✅ |
| GET | `/api/notifications/unread-count` | 읽지 않은 알림 수 | ✅ |
| PUT | `/api/notifications/:id/read` | 알림 읽음 처리 | ✅ |
| PUT | `/api/notifications/mark-all-read` | 모든 알림 읽음 처리 | ✅ |
| DELETE | `/api/notifications/:id` | 알림 삭제 | ✅ |
| DELETE | `/api/notifications` | 모든 알림 삭제 | ✅ |

### 7. 리뷰 (Reviews) - 5개
| 메서드 | 엔드포인트 | 설명 | 인증 필요 | 권한 |
|--------|------------|------|-----------|------|
| POST | `/api/reviews` | 리뷰 작성 | ✅ | 계약 당사자 |
| PUT | `/api/reviews/:id` | 리뷰 수정 | ✅ | 리뷰 작성자 |
| DELETE | `/api/reviews/:id` | 리뷰 삭제 | ✅ | 리뷰 작성자 |
| GET | `/api/reviews/user/:userId` | 사용자 리뷰 목록 조회 | ❌ | - |
| GET | `/api/reviews/contract/:contractId` | 계약별 리뷰 조회 | ❌ | - |

### 8. 분석/통계 (Analytics) - 4개
| 메서드 | 엔드포인트 | 설명 | 인증 필요 | 권한 |
|--------|------------|------|-----------|------|
| POST | `/api/analytics/dashboard` | 대시보드 분석 데이터 조회 | ✅ | - |
| POST | `/api/analytics/partner-performance` | 파트너 성과 분석 | ✅ | - |
| POST | `/api/analytics/client-activity` | 클라이언트 활동 분석 | ✅ | - |
| POST | `/api/analytics/trends` | 플랫폼 트렌드 분석 | ✅ | - |

### 9. RPC 함수 (RPC Functions) - 3개
| 메서드 | 엔드포인트 | 설명 | 인증 필요 | 권한 |
|--------|------------|------|-----------|------|
| POST | `/api/rpc/create-notification` | 알림 생성 | ✅ | - |
| POST | `/api/rpc/get-user-role` | 사용자 역할 조회 | ✅ | - |
| POST | `/api/rpc/has-role` | 사용자 역할 확인 | ✅ | - |

### 10. 파일 스토리지 (Storage) - 4개
| 메서드 | 엔드포인트 | 설명 | 인증 필요 | 권한 |
|--------|------------|------|-----------|------|
| POST | `/api/storage/upload/portfolios` | 포트폴리오 이미지 업로드 | ✅ | - |
| POST | `/api/storage/upload/profile-image` | 프로필 이미지 업로드 | ✅ | - |
| DELETE | `/api/storage/delete/:filename` | 파일 삭제 | ✅ | 파일 소유자 |
| POST | `/api/storage/delete-multiple` | 여러 파일 삭제 | ✅ | 파일 소유자 |

### 11. 실시간 기능 (Real-time) - 4개
| 메서드 | 엔드포인트 | 설명 | 인증 필요 | 권한 |
|--------|------------|------|-----------|------|
| POST | `/api/realtime/subscribe` | 실시간 구독 | ✅ | 본인 |
| POST | `/api/realtime/unsubscribe` | 실시간 구독 해제 | ✅ | 본인 |
| GET | `/api/realtime/channels` | 활성 채널 목록 | ✅ | 본인 |
| POST | `/api/realtime/postgres-changes` | PostgreSQL 변경사항 구독 | ✅ | 본인 |

### 12. 채널 (Channels) - 5개
| 메서드 | 엔드포인트 | 설명 | 인증 필요 | 권한 |
|--------|------------|------|-----------|------|
| POST | `/api/channels/create` | 실시간 채널 생성 | ✅ | 본인 |
| POST | `/api/channels/subscribe` | 채널 구독 | ✅ | 본인 |
| POST | `/api/channels/unsubscribe` | 채널 구독 해제 | ✅ | 본인 |
| GET | `/api/channels/list` | 채널 목록 조회 | ✅ | 본인 |
| DELETE | `/api/channels/:id` | 채널 삭제 | ✅ | 본인 |

### 13. 프로필 (Profiles) - 4개
| 메서드 | 엔드포인트 | 설명 | 인증 필요 | 권한 |
|--------|------------|------|-----------|------|
| GET | `/api/profiles/:id` | 프로필 조회 | ❌ | - |
| PUT | `/api/profiles` | 프로필 수정 | ✅ | 본인 |
| POST | `/api/profiles/avatar` | 프로필 이미지 업로드 | ✅ | 본인 |
| DELETE | `/api/profiles/avatar` | 프로필 이미지 삭제 | ✅ | 본인 |

### 14. 메시지 (Messages) - 5개
| 메서드 | 엔드포인트 | 설명 | 인증 필요 |
|--------|------------|------|-----------|
| POST | `/api/messages` | 메시지 전송 | ✅ |
| GET | `/api/messages` | 메시지 목록 조회 | ✅ |
| GET | `/api/messages/conversations` | 대화 목록 조회 | ✅ |
| GET | `/api/messages/unread-count` | 읽지 않은 메시지 수 | ✅ |
| PUT | `/api/messages/:id/read` | 메시지 읽음 처리 | ✅ |

### 15. 파트너 (Partners) - 7개
| 메서드 | 엔드포인트 | 설명 | 인증 필요 | 권한 |
|--------|------------|------|-----------|------|
| GET | `/api/partners` | 파트너 목록 조회 | ❌ | - |
| GET | `/api/partners/:id` | 파트너 상세 조회 | ❌ | - |
| POST | `/api/partners/profile` | 파트너 프로필 생성/수정 | ✅ | Partner |
| GET | `/api/partners/profile/me` | 내 파트너 프로필 | ✅ | Partner |
| POST | `/api/partners/portfolios` | 포트폴리오 생성 | ✅ | Partner |
| PUT | `/api/partners/portfolios/:id` | 포트폴리오 수정 | ✅ | Partner |
| DELETE | `/api/partners/portfolios/:id` | 포트폴리오 삭제 | ✅ | Partner |

### 16. 제안서 (Proposals) - 7개
| 메서드 | 엔드포인트 | 설명 | 인증 필요 | 권한 |
|--------|------------|------|-----------|------|
| POST | `/api/proposals` | 제안서 제출 | ✅ | Partner |
| GET | `/api/proposals/my` | 내 제안서 목록 | ✅ | Partner |
| GET | `/api/proposals/project/:projectId` | 프로젝트 제안서 목록 | ✅ | Client |
| GET | `/api/proposals/:id` | 제안서 상세 조회 | ✅ | - |
| PUT | `/api/proposals/:id/status` | 제안서 상태 업데이트 | ✅ | Client |
| PUT | `/api/proposals/:id` | 제안서 수정 | ✅ | Partner |
| DELETE | `/api/proposals/:id` | 제안서 삭제 | ✅ | Partner |

### 17. 계약 (Contracts) - 5개
| 메서드 | 엔드포인트 | 설명 | 인증 필요 | 권한 |
|--------|------------|------|-----------|------|
| POST | `/api/contracts` | 계약 생성 | ✅ | Client |
| GET | `/api/contracts` | 계약 목록 조회 | ✅ | - |
| GET | `/api/contracts/:id` | 계약 상세 조회 | ✅ | - |
| PUT | `/api/contracts/:id/status` | 계약 상태 업데이트 | ✅ | - |
| PUT | `/api/contracts/:id` | 계약 수정 | ✅ | Client |

### 18. 시스템 (System) - 1개
| 메서드 | 엔드포인트 | 설명 | 인증 필요 |
|--------|------------|------|-----------|
| GET | `/api/health` | 서버 상태 확인 | ❌ |

## 🔄 실시간 기능 (Socket.io)

### 실시간 이벤트
| 이벤트 | 설명 | 데이터 |
|--------|------|--------|
| `send_message` | 메시지 전송 | `{ conversationId, content, type }` |
| `new_message` | 새 메시지 수신 | `{ id, content, senderId, createdAt }` |
| `new_notification` | 새 알림 수신 | `{ id, title, message, type }` |
| `project_status_update` | 프로젝트 상태 변경 | `{ projectId, status, updatedAt }` |
| `proposal_status_update` | 제안서 상태 변경 | `{ proposalId, status, updatedAt }` |
| `contract_status_update` | 계약 상태 변경 | `{ contractId, status, updatedAt }` |

### 실시간 구독
- **채널 구독**: `POST /api/realtime/subscribe`
- **PostgreSQL 변경사항 구독**: `POST /api/realtime/postgres-changes`
- **채널 생성**: `POST /api/channels/create`

## 🔍 쿼리 파라미터

### 페이지네이션
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 10, 최대: 100)

### 필터링
- `search`: 검색어
- `status`: 상태 필터
- `projectType`: 프로젝트 유형 (fixed, hourly)
- `budgetRange`: 예산 범위 (under1m, 1m-5m, 5m-10m, over10m)
- `techStackIds`: 기술 스택 ID (쉼표로 구분)

## 📝 사용 예시

### 1. 회원가입
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "fullName": "홍길동",
    "role": "client"
  }'
```

### 2. 로그인
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### 3. 프로젝트 생성
```bash
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "title": "웹사이트 리뉴얼 프로젝트",
    "description": "기존 웹사이트를 모던한 디자인으로 리뉴얼하는 프로젝트입니다.",
    "projectType": "fixed",
    "budgetMin": 1000000,
    "budgetMax": 5000000,
    "durationWeeks": 4,
    "techStackIds": ["uuid1", "uuid2"]
  }'
```

### 4. 프로젝트 목록 조회
```bash
curl -X GET "http://localhost:3001/api/projects?page=1&limit=10&search=웹사이트&projectType=fixed" \
  -H "Authorization: Bearer <your-jwt-token>"
```

### 5. 사용자 프로필 조회
```bash
curl -X GET http://localhost:3001/api/users/profile/user-uuid-here
```

### 6. 프로필 수정
```bash
curl -X PUT http://localhost:3001/api/users/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "fullName": "홍길동",
    "phone": "010-1234-5678",
    "avatarUrl": "https://example.com/avatar.jpg"
  }'
```

### 7. 사용자 통계 조회
```bash
curl -X GET http://localhost:3001/api/users/stats \
  -H "Authorization: Bearer <your-jwt-token>"
```

### 8. 서버 상태 확인
```bash
curl -X GET http://localhost:3001/api/health
```

## 🚨 에러 코드

| 상태 코드 | 설명 |
|-----------|------|
| 200 | 성공 |
| 201 | 생성 성공 |
| 400 | 잘못된 요청 |
| 401 | 인증 필요 |
| 403 | 권한 없음 |
| 404 | 리소스를 찾을 수 없음 |
| 500 | 서버 내부 오류 |

## 🔧 개발 도구

### Swagger UI
- **개발 환경**: `http://localhost:3001/api-docs`
- **프로덕션 환경**: `https://your-railway-app.railway.app/api-docs`
- **기능**: API 테스트, 문서 확인, 스키마 검토, 실시간 테스트

### API 테스트
```bash
# 서버 상태 확인
curl http://localhost:3001/api/health

# Swagger UI 접근
open http://localhost:3001/api-docs
```

### 환경별 URL
- **개발**: `http://localhost:3001/api`
- **프로덕션**: `https://your-railway-app.railway.app/api`

## 📋 API 상태

### ✅ 구현 완료
- 모든 75개 엔드포인트 구현 완료
- JWT 인증 시스템
- 실시간 기능 (Socket.io)
- 파일 업로드/다운로드
- 데이터베이스 연동 (PostgreSQL)
- 에러 처리 및 검증

### 🧪 테스트 상태
- **테스트 커버리지**: 100% (92개 테스트 통과)
- **성능 테스트**: 완료
- **통합 테스트**: 완료
- **실시간 기능 테스트**: 완료

## 📞 지원

- **이메일**: support@gigweaveflow.com
- **문서**: [API 문서](http://localhost:3001/api-docs)
- **GitHub**: [프로젝트 저장소](https://github.com/your-org/gig-weave-flow)
- **테스트 결과**: [TEST_RESULTS.md](./TEST_RESULTS.md)
