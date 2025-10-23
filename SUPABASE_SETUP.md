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

### 3.1 Prisma 마이그레이션 실행
Railway 배포 후 다음 명령어 실행:

```bash
# Railway 터미널에서 실행
npx prisma migrate deploy
```

### 3.2 수동으로 스키마 생성 (선택사항)
Supabase SQL Editor에서 실행:

```sql
-- 모든 테이블이 자동으로 생성됩니다
-- Prisma 마이그레이션이 실행되면 확인하세요
```

## 4. Supabase 설정 확인

### 4.1 테이블 확인
1. Supabase 대시보드에서 "Table Editor" 이동
2. 다음 테이블들이 생성되었는지 확인:
   - `profiles`
   - `user_roles`
   - `tech_stacks`
   - `partner_profiles`
   - `portfolios`
   - `projects`
   - `proposals`
   - `contracts`
   - `messages`
   - `reviews`
   - `notifications`

### 4.2 RLS (Row Level Security) 설정
Supabase는 기본적으로 RLS가 활성화되어 있습니다. 필요에 따라 설정을 조정하세요.

## 5. 환경변수 설정

### 5.1 Railway 환경변수
Railway 대시보드에서 다음 환경변수 설정:

```bash
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

### 5.2 로컬 개발 환경변수
`.env` 파일에 추가:

```bash
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

## 6. 연결 테스트

### 6.1 API 테스트
```bash
# 서버 상태 확인
curl https://your-railway-app.railway.app/api/health

# 사용자 등록 테스트
curl -X POST https://your-railway-app.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","fullName":"Test User","role":"client"}'
```

### 6.2 Supabase 대시보드 확인
1. "Table Editor"에서 `profiles` 테이블 확인
2. 새로 생성된 사용자 데이터 확인
3. "Authentication" → "Users"에서 사용자 목록 확인

## 7. 문제 해결

### 7.1 연결 실패
- **확인사항**: `DATABASE_URL` 형식이 올바른지 확인
- **해결방법**: Supabase 대시보드에서 연결 문자열 다시 복사

### 7.2 마이그레이션 실패
- **확인사항**: Supabase 프로젝트가 활성화되어 있는지 확인
- **해결방법**: 
  ```bash
  npx prisma migrate reset
  npx prisma migrate deploy
  ```

### 7.3 권한 오류
- **확인사항**: 데이터베이스 비밀번호가 올바른지 확인
- **해결방법**: Supabase에서 비밀번호 재설정

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
