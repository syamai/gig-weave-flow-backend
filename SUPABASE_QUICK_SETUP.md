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

### 4단계: 데이터베이스 연결 문자열 복사
1. Supabase 대시보드에서 "Settings" → "Database" 이동
2. "Connection string" 섹션에서 "URI" 복사
3. 형식: `postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres`

### 5단계: Railway에 환경변수 설정
1. Railway 대시보드에서 프로젝트 선택
2. "Variables" 탭 클릭
3. 다음 환경변수 추가:

```bash
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
JWT_SECRET=your-super-secret-jwt-key-here-change-in-production
JWT_EXPIRES_IN=7d
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-frontend-domain.com
SOCKET_CORS_ORIGIN=https://your-frontend-domain.com
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
cd /Users/ahnsungbin/Source/gig-weave-flow/backend
supabase init
```

### 4단계: 원격 프로젝트 연결
```bash
supabase link --project-ref [YOUR-PROJECT-REF]
```

### 5단계: 데이터베이스 스키마 푸시
```bash
supabase db push
```

## 방법 3: 수동으로 데이터베이스 설정

### 1단계: Supabase SQL Editor 사용
1. Supabase 대시보드에서 "SQL Editor" 이동
2. "New query" 클릭
3. 다음 SQL 실행:

```sql
-- 기본 테이블 생성 (Prisma 마이그레이션 대신)
-- 이 방법은 권장하지 않습니다. Prisma 마이그레이션을 사용하세요.
```

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
  -d '{"email":"test@example.com","password":"password123","fullName":"Test User","role":"client"}'
```

### 3. Supabase 대시보드 확인
1. "Table Editor"에서 `profiles` 테이블 확인
2. 새로 생성된 사용자 데이터 확인

## 🚨 문제 해결

### 연결 실패
- **확인**: `DATABASE_URL` 형식이 올바른지 확인
- **해결**: Supabase 대시보드에서 연결 문자열 다시 복사

### 마이그레이션 실패
- **확인**: Supabase 프로젝트가 활성화되어 있는지 확인
- **해결**: Railway 터미널에서 `npx prisma migrate deploy` 실행

### 권한 오류
- **확인**: 데이터베이스 비밀번호가 올바른지 확인
- **해결**: Supabase에서 비밀번호 재설정

## 📞 도움이 필요하시면

1. **Supabase 문서**: [docs.supabase.com](https://docs.supabase.com)
2. **Railway 문서**: [docs.railway.app](https://docs.railway.app)
3. **프로젝트 README**: [README.md](./README.md)
