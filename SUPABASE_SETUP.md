# 🗄️ Supabase 데이터베이스 설정 가이드

## 1. Supabase 프로젝트 생성

### 1.1 계정 생성 및 로그인
1. [supabase.com](https://supabase.com) 접속
2. "Start your project" 클릭
3. GitHub 계정으로 로그인

### 1.2 새 프로젝트 생성
1. "New Project" 클릭
2. **Organization**: 개인 계정 또는 팀 선택
3. **Project Name**: `gig-weave-flow`
4. **Database Password**: 강력한 비밀번호 설정 (기록해두세요!)
5. **Region**: 가장 가까운 지역 선택 (예: Northeast Asia - Seoul)
6. "Create new project" 클릭

## 2. 데이터베이스 연결 정보 확인

### 2.1 연결 문자열 복사
1. Supabase 대시보드에서 "Settings" → "Database" 이동
2. "Connection string" 섹션에서 "URI" 복사
3. 형식: `postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres`

### 2.2 프로젝트 정보 확인
- **Project URL**: `https://[YOUR-PROJECT-REF].supabase.co`
- **API Key (anon)**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **API Key (service_role)**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 3. 데이터베이스 스키마 설정

### 3.1 essential-tables.sql 실행
Supabase SQL Editor에서 `essential-tables.sql` 파일의 내용을 실행하세요:

1. Supabase 대시보드에서 "SQL Editor" 이동
2. "New query" 클릭
3. `essential-tables.sql` 파일의 내용을 복사하여 실행

### 3.2 스키마 확인
실행 후 다음 테이블들이 생성되었는지 확인:
- `users` - 사용자 정보
- `profiles` - 프로필 정보
- `projects` - 프로젝트
- `proposals` - 제안서
- `contracts` - 계약
- `messages` - 메시지
- `notifications` - 알림
- `tech_stacks` - 기술 스택
- `portfolios` - 포트폴리오
- `reviews` - 리뷰

## 4. Supabase 설정 확인

### 4.1 테이블 확인
1. Supabase 대시보드에서 "Table Editor" 이동
2. 모든 테이블이 생성되었는지 확인
3. RLS (Row Level Security) 정책이 적용되었는지 확인

### 4.2 RLS (Row Level Security) 설정
Supabase는 기본적으로 RLS가 활성화되어 있습니다. `essential-tables.sql`에 포함된 정책들이 자동으로 적용됩니다.

## 5. 환경변수 설정

### 5.1 Railway 환경변수
Railway 대시보드에서 다음 환경변수 설정:

```bash
# Supabase 설정
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# JWT 설정
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# 서버 설정
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
```

### 5.2 로컬 개발 환경변수
`.env` 파일에 추가:

```bash
# Supabase 설정
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# JWT 설정
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# 서버 설정
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:8080
```

## 6. 연결 테스트

### 6.1 API 테스트
```bash
# 서버 상태 확인
curl https://your-railway-app.railway.app/api/health

# 사용자 등록 테스트
curl -X POST https://your-railway-app.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","fullName":"Test User","role":"CLIENT"}'
```

### 6.2 Supabase 대시보드 확인
1. "Table Editor"에서 `users` 테이블 확인
2. 새로 생성된 사용자 데이터 확인
3. "Authentication" → "Users"에서 사용자 목록 확인

## 7. 문제 해결

### 7.1 연결 실패
- **확인사항**: `SUPABASE_URL`과 `SUPABASE_SERVICE_ROLE_KEY`가 올바른지 확인
- **해결방법**: Supabase 대시보드에서 API 키 다시 복사

### 7.2 스키마 생성 실패
- **확인사항**: Supabase 프로젝트가 활성화되어 있는지 확인
- **해결방법**: `essential-tables.sql`을 다시 실행

### 7.3 권한 오류
- **확인사항**: `SUPABASE_SERVICE_ROLE_KEY`가 올바른지 확인
- **해결방법**: Supabase에서 서비스 역할 키 다시 복사

## 8. Supabase 추가 기능

### 8.1 실시간 기능
- Supabase Realtime을 사용하여 실시간 업데이트 구현
- WebSocket 연결을 통한 실시간 데이터 동기화

### 8.2 인증 시스템
- Supabase Auth를 사용하여 사용자 인증 관리
- JWT 토큰 자동 관리

### 8.3 파일 스토리지
- Supabase Storage를 사용하여 파일 업로드/다운로드
- CDN을 통한 빠른 파일 서빙

## 9. 모니터링 및 백업

### 9.1 데이터베이스 모니터링
- Supabase 대시보드에서 쿼리 성능 모니터링
- 연결 수 및 응답 시간 확인

### 9.2 자동 백업
- Supabase는 자동으로 데이터베이스 백업을 수행
- 필요시 수동 백업도 가능

### 9.3 로그 확인
- Supabase 대시보드에서 데이터베이스 로그 확인
- Railway 대시보드에서 애플리케이션 로그 확인