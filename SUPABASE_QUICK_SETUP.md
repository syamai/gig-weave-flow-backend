# 🚀 Supabase 빠른 설정 가이드

## 방법 1: Supabase 웹사이트를 통한 설정 (권장)

### 1단계: Supabase 계정 생성
1. [supabase.com](https://supabase.com) 접속
2. "Start your project" 클릭
3. GitHub 계정으로 로그인

### 2단계: 새 프로젝트 생성
1. "New Project" 클릭
2. **Organization**: 개인 계정 선택
3. **Project Name**: `gig-weave-flow`
4. **Database Password**: 강력한 비밀번호 설정 (예: `MySecurePassword123!`)
5. **Region**: `Northeast Asia (Seoul)` 선택
6. "Create new project" 클릭

### 3단계: 프로젝트 정보 확인
프로젝트가 생성되면 다음 정보를 확인하세요:

- **Project URL**: `https://[PROJECT-REF].supabase.co`
- **Database Password**: 위에서 설정한 비밀번호
- **Project Reference**: URL에서 확인 가능

### 4단계: 데이터베이스 스키마 생성
1. Supabase 대시보드에서 "SQL Editor" 이동
2. "New query" 클릭
3. `essential-tables.sql` 파일의 내용을 복사하여 실행
4. 모든 테이블과 RLS 정책이 생성되는지 확인

### 5단계: API 키 확인
1. Supabase 대시보드에서 "Settings" → "API" 이동
2. 다음 키들을 복사:
   - **Project URL**: `https://[PROJECT-REF].supabase.co`
   - **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 6단계: Railway에 환경변수 설정
1. Railway 대시보드에서 프로젝트 선택
2. "Variables" 탭 클릭
3. 다음 환경변수 추가:

```bash
# Supabase 설정
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# JWT 설정
JWT_SECRET=your-super-secret-jwt-key-here-change-in-production
JWT_EXPIRES_IN=7d

# 서버 설정
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-frontend-domain.com
```

## 방법 2: Supabase CLI 사용 (고급)

### 1단계: Supabase CLI 설치
```bash
# macOS (Homebrew)
brew install supabase/tap/supabase

# 또는 직접 다운로드
curl -o supabase https://github.com/supabase/cli/releases/latest/download/supabase_darwin_amd64
chmod +x supabase
sudo mv supabase /usr/local/bin/
```

### 2단계: Supabase 로그인
```bash
supabase login
```

### 3단계: 프로젝트 초기화
```bash
cd /Users/ahnsungbin/Source/gig-weave-flow-backend
supabase init
```

### 4단계: 원격 프로젝트 연결
```bash
supabase link --project-ref [YOUR-PROJECT-REF]
```

### 5단계: 데이터베이스 스키마 푸시
```bash
# essential-tables.sql을 migrations 폴더에 복사 후
supabase db push
```

## 방법 3: 수동으로 데이터베이스 설정

### 1단계: Supabase SQL Editor 사용
1. Supabase 대시보드에서 "SQL Editor" 이동
2. "New query" 클릭
3. `essential-tables.sql` 파일의 내용을 복사하여 실행

### 2단계: 테이블 생성 확인
1. "Table Editor"에서 다음 테이블들이 생성되었는지 확인:
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

## 🎯 권장 방법

**방법 1 (웹사이트)**을 사용하는 것을 강력히 권장합니다:
- ✅ 가장 간단하고 안전함
- ✅ GUI를 통한 직관적인 설정
- ✅ 실시간 모니터링 가능
- ✅ 자동 백업 및 보안 설정

## 🔧 설정 완료 후 확인사항

### 1. 데이터베이스 연결 테스트
```bash
# Railway 배포 후 실행
curl https://your-railway-app.railway.app/api/health
```

### 2. 사용자 등록 테스트
```bash
curl -X POST https://your-railway-app.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","fullName":"Test User","role":"CLIENT"}'
```

### 3. Supabase 대시보드 확인
1. "Table Editor"에서 `users` 테이블 확인
2. 새로 생성된 사용자 데이터 확인

## 🚨 문제 해결

### 연결 실패
- **확인**: `SUPABASE_URL`과 `SUPABASE_SERVICE_ROLE_KEY`가 올바른지 확인
- **해결**: Supabase 대시보드에서 API 키 다시 복사

### 스키마 생성 실패
- **확인**: Supabase 프로젝트가 활성화되어 있는지 확인
- **해결**: `essential-tables.sql`을 다시 실행

### 권한 오류
- **확인**: `SUPABASE_SERVICE_ROLE_KEY`가 올바른지 확인
- **해결**: Supabase에서 서비스 역할 키 다시 복사

## 📞 도움이 필요하시면

1. **Supabase 문서**: [docs.supabase.com](https://docs.supabase.com)
2. **Railway 문서**: [docs.railway.app](https://docs.railway.app)
3. **프로젝트 README**: [README.md](./README.md)