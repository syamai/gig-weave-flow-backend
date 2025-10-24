# Gig Weave Flow Backend

프리랜서 마켓플레이스 플랫폼의 백엔드 API 서버입니다.

## 🚀 기술 스택

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL (Supabase)
- **Database Client**: Supabase Client
- **Authentication**: JWT
- **Real-time**: Socket.io
- **File Upload**: Multer
- **Validation**: Joi
- **Deployment**: Railway

## 📁 프로젝트 구조

```
backend/
├── src/
│   ├── controllers/     # API 컨트롤러
│   ├── middleware/      # 미들웨어 (auth, validation, upload 등)
│   ├── routes/          # 라우트 정의
│   ├── services/        # 비즈니스 로직
│   ├── utils/           # 유틸리티 함수
│   ├── config/          # 설정 파일
│   └── app.js           # Express 앱 설정
├── uploads/             # 파일 업로드 디렉토리
├── essential-tables.sql # Supabase 테이블 스키마
├── package.json
├── server.js            # 서버 진입점
└── railway.json         # Railway 배포 설정
```

## 🛠️ 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
```bash
cp env.example .env
```

`.env` 파일을 편집하여 필요한 환경 변수를 설정하세요:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/gig_weave_flow"

# Supabase
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
SUPABASE_ANON_KEY="your-anon-key"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV="development"

# CORS
FRONTEND_URL="http://localhost:8080"
```

### 3. 데이터베이스 설정
```bash
# Supabase에서 essential-tables.sql 실행
# Supabase 대시보드의 SQL Editor에서 실행하세요
```

### 4. 서버 실행
```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm start
```

## 📚 API 문서

### Swagger UI
- **개발 환경**: http://localhost:3001/api-docs
- **프로덕션 환경**: https://gig-weave-flow-backend-production.up.railway.app/api-docs

### 상세 API 문서
모든 API 엔드포인트의 상세한 문서는 [API_DOCS.md](./API_DOCS.md)를 참조하세요.

### 주요 엔드포인트

#### 인증 (Authentication)
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/me` - 현재 사용자 정보
- `POST /api/auth/logout` - 로그아웃
- `PUT /api/auth/change-password` - 비밀번호 변경

#### 프로젝트 (Projects)
- `GET /api/projects` - 프로젝트 목록 조회
- `GET /api/projects/:id` - 프로젝트 상세 조회
- `POST /api/projects` - 프로젝트 생성 (클라이언트)
- `PUT /api/projects/:id` - 프로젝트 수정 (클라이언트)
- `DELETE /api/projects/:id` - 프로젝트 삭제 (클라이언트)
- `GET /api/projects/my/projects` - 내 프로젝트 목록

#### 파트너 (Partners)
- `GET /api/partners` - 파트너 목록 조회
- `GET /api/partners/:id` - 파트너 상세 조회
- `POST /api/partners/profile` - 파트너 프로필 생성/수정
- `GET /api/partners/profile/me` - 내 파트너 프로필
- `POST /api/partners/portfolios` - 포트폴리오 생성
- `PUT /api/partners/portfolios/:id` - 포트폴리오 수정
- `DELETE /api/partners/portfolios/:id` - 포트폴리오 삭제

#### 제안서 (Proposals)
- `POST /api/proposals` - 제안서 제출 (파트너)
- `GET /api/proposals/my` - 내 제안서 목록 (파트너)
- `GET /api/proposals/project/:projectId` - 프로젝트 제안서 목록 (클라이언트)
- `GET /api/proposals/:id` - 제안서 상세 조회
- `PUT /api/proposals/:id/status` - 제안서 상태 업데이트 (클라이언트)
- `PUT /api/proposals/:id` - 제안서 수정 (파트너)
- `DELETE /api/proposals/:id` - 제안서 삭제 (파트너)

#### 계약 (Contracts)
- `POST /api/contracts` - 계약 생성 (클라이언트)
- `GET /api/contracts` - 계약 목록 조회
- `GET /api/contracts/:id` - 계약 상세 조회
- `PUT /api/contracts/:id/status` - 계약 상태 업데이트
- `PUT /api/contracts/:id` - 계약 수정 (클라이언트)

#### 메시지 (Messages)
- `POST /api/messages` - 메시지 전송
- `GET /api/messages` - 메시지 목록 조회
- `GET /api/messages/conversations` - 대화 목록 조회
- `GET /api/messages/unread-count` - 읽지 않은 메시지 수
- `PUT /api/messages/:id/read` - 메시지 읽음 처리

#### 기술 스택 (Tech Stacks)
- `GET /api/tech-stacks` - 기술 스택 목록 조회
- `GET /api/tech-stacks/categories` - 카테고리 목록 조회
- `GET /api/tech-stacks/:id` - 기술 스택 상세 조회

#### 알림 (Notifications)
- `GET /api/notifications` - 알림 목록 조회
- `GET /api/notifications/unread-count` - 읽지 않은 알림 수
- `PUT /api/notifications/:id/read` - 알림 읽음 처리
- `PUT /api/notifications/mark-all-read` - 모든 알림 읽음 처리
- `DELETE /api/notifications/:id` - 알림 삭제
- `DELETE /api/notifications` - 모든 알림 삭제

#### 사용자 (Users)
- `GET /api/users/profile/:id` - 사용자 프로필 조회
- `PUT /api/users/profile` - 프로필 수정
- `GET /api/users/stats` - 사용자 통계

#### 파일 업로드 (Upload)
- `POST /api/upload/profile-image` - 프로필 이미지 업로드
- `POST /api/upload/portfolio-images` - 포트폴리오 이미지 업로드
- `DELETE /api/upload/:filename` - 파일 삭제

#### RPC 함수 (RPC Functions)
- `POST /api/rpc/create-notification` - 알림 생성
- `POST /api/rpc/get-user-role` - 사용자 역할 조회
- `POST /api/rpc/has-role` - 사용자 역할 확인

#### 파일 스토리지 (Storage)
- `POST /api/storage/upload/portfolios` - 포트폴리오 이미지 업로드
- `POST /api/storage/upload/profile-image` - 프로필 이미지 업로드
- `DELETE /api/storage/delete/:filename` - 파일 삭제
- `POST /api/storage/delete-multiple` - 여러 파일 삭제

#### 프로필 (Profiles)
- `GET /api/profiles/:id` - 프로필 조회
- `PUT /api/profiles` - 프로필 수정
- `POST /api/profiles/avatar` - 프로필 이미지 업로드
- `DELETE /api/profiles/avatar` - 프로필 이미지 삭제

#### 실시간 (Real-time)
- `POST /api/realtime/subscribe` - 실시간 구독
- `POST /api/realtime/unsubscribe` - 실시간 구독 해제
- `GET /api/realtime/channels` - 활성 채널 목록
- `POST /api/realtime/postgres-changes` - PostgreSQL 변경사항 구독

#### 채널 (Channels)
- `POST /api/channels/create` - 실시간 채널 생성
- `POST /api/channels/subscribe` - 채널 구독
- `POST /api/channels/unsubscribe` - 채널 구독 해제
- `GET /api/channels/list` - 채널 목록 조회
- `DELETE /api/channels/:id` - 채널 삭제

#### 시스템 (System)
- `GET /api/health` - 서버 상태 확인

## 🔧 개발 도구

### Supabase 대시보드
Supabase 대시보드에서 데이터베이스를 시각적으로 탐색하고 편집할 수 있습니다.
- **URL**: https://supabase.com/dashboard

### 데이터베이스 스키마
```bash
# essential-tables.sql 파일을 Supabase SQL Editor에서 실행
# 이 파일에는 모든 테이블, 인덱스, RLS 정책이 포함되어 있습니다
```

## 🚀 Railway 배포

### 1. Railway 계정 생성
[Railway](https://railway.app)에서 계정을 생성하세요.

### 2. 프로젝트 연결
1. Railway 대시보드에서 "New Project" 클릭
2. "Deploy from GitHub repo" 선택
3. 이 저장소를 선택

### 3. 환경 변수 설정
Railway 대시보드에서 다음 환경 변수들을 설정하세요:

- `DATABASE_URL` - Railway PostgreSQL URL (선택사항)
- `SUPABASE_URL` - Supabase 프로젝트 URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase 서비스 역할 키
- `SUPABASE_ANON_KEY` - Supabase 익명 키
- `JWT_SECRET` - JWT 비밀키
- `FRONTEND_URL` - 프론트엔드 URL
- `NODE_ENV` - production

### 4. 자동 배포
GitHub에 푸시하면 자동으로 배포됩니다.

## 🔒 보안

- JWT 기반 인증
- 비밀번호 해싱 (bcrypt)
- CORS 설정
- Rate limiting
- Helmet 보안 헤더
- 입력 검증 (Joi)
- Supabase RLS (Row Level Security)

## 📝 라이선스

MIT License