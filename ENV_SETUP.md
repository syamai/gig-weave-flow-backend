# 🔧 환경변수 설정 가이드

## 📋 .env 파일 생성 방법

### 1단계: .env 파일 생성
```bash
# 백엔드 디렉토리에서 실행
cd /Users/ahnsungbin/Source/gig-weave-flow/backend
cp env.example .env
```

### 2단계: .env 파일 편집
```bash
# 텍스트 에디터로 .env 파일 열기
nano .env
# 또는
code .env
# 또는
vim .env
```

## 🔑 필수 환경변수 설정

### Supabase 데이터베이스 설정
```bash
# 1. Supabase 프로젝트 생성 후 연결 문자열 복사
# Supabase 대시보드 → Settings → Database → Connection string
DATABASE_URL="postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres"

# 2. Supabase 프로젝트 URL
SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"

# 3. Supabase API 키들
# Supabase 대시보드 → Settings → API
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### JWT 인증 설정
```bash
# 강력한 JWT 시크릿 키 생성 (프로덕션용)
JWT_SECRET="your-super-secret-jwt-key-here-change-in-production"
JWT_EXPIRES_IN="7d"
```

### 서버 설정
```bash
PORT=3001
NODE_ENV="development"
```

### CORS 설정
```bash
# 로컬 개발용
FRONTEND_URL="http://localhost:3000"
SOCKET_CORS_ORIGIN="http://localhost:3000"

# 프로덕션용 (배포 시 변경)
# FRONTEND_URL="https://your-frontend-domain.com"
# SOCKET_CORS_ORIGIN="https://your-frontend-domain.com"
```

## 🚀 빠른 설정 스크립트

### 자동 .env 파일 생성
```bash
#!/bin/bash
# create-env.sh

echo "🔧 Gig Weave Flow Backend 환경변수 설정"
echo "========================================"

# .env 파일 생성
if [ ! -f .env ]; then
    cp env.example .env
    echo "✅ .env 파일이 생성되었습니다."
else
    echo "⚠️  .env 파일이 이미 존재합니다."
fi

echo ""
echo "📝 다음 단계를 수행하세요:"
echo "1. Supabase 프로젝트 생성: https://supabase.com"
echo "2. DATABASE_URL 업데이트"
echo "3. SUPABASE_URL 업데이트"
echo "4. SUPABASE_ANON_KEY 업데이트"
echo "5. SUPABASE_SERVICE_ROLE_KEY 업데이트"
echo "6. JWT_SECRET 변경"
echo ""
echo "편집 명령어: nano .env"
```

### 스크립트 실행
```bash
chmod +x create-env.sh
./create-env.sh
```

## 🔍 환경변수 확인

### 설정된 환경변수 확인
```bash
# 모든 환경변수 확인
cat .env

# 특정 환경변수 확인
grep "DATABASE_URL" .env
grep "JWT_SECRET" .env
```

### 환경변수 로드 테스트
```bash
# Node.js로 환경변수 로드 테스트
node -e "require('dotenv').config(); console.log('DATABASE_URL:', process.env.DATABASE_URL ? '설정됨' : '설정 안됨');"
```

## 🚨 보안 주의사항

### .gitignore 확인
```bash
# .gitignore에 .env 파일이 포함되어 있는지 확인
grep -n "\.env" .gitignore
```

### .gitignore에 추가 (필요시)
```bash
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore
```

## 📊 환경별 설정

### 개발 환경 (.env)
```bash
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
SOCKET_CORS_ORIGIN="http://localhost:3000"
LOG_LEVEL="debug"
DEBUG="app:*"
```

### 프로덕션 환경 (.env.production)
```bash
NODE_ENV="production"
FRONTEND_URL="https://your-frontend-domain.com"
SOCKET_CORS_ORIGIN="https://your-frontend-domain.com"
LOG_LEVEL="info"
```

### 테스트 환경 (.env.test)
```bash
NODE_ENV="test"
DATABASE_URL="postgresql://test:test123@localhost:5432/gig_weave_flow_test"
```

## 🔧 Railway 배포 시 환경변수 설정

### Railway 대시보드에서 설정
1. Railway 프로젝트 선택
2. "Variables" 탭 클릭
3. 다음 환경변수 추가:

```bash
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
JWT_SECRET=your-super-secret-jwt-key-here-change-in-production
JWT_EXPIRES_IN=7d
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
SOCKET_CORS_ORIGIN=https://your-frontend-domain.com
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🎯 설정 완료 확인

### 1. 서버 시작 테스트
```bash
npm run dev
```

### 2. API 상태 확인
```bash
curl http://localhost:3001/api/health
```

### 3. 데이터베이스 연결 확인
```bash
npx prisma db pull
```

## 📞 문제 해결

### 환경변수 로드 실패
- `.env` 파일이 프로젝트 루트에 있는지 확인
- 파일 권한 확인: `ls -la .env`
- 문법 오류 확인: 주석과 값 사이에 공백 없이

### 데이터베이스 연결 실패
- `DATABASE_URL` 형식 확인
- Supabase 프로젝트 상태 확인
- 방화벽 설정 확인

### CORS 오류
- `FRONTEND_URL`과 `SOCKET_CORS_ORIGIN` 일치 확인
- 프로토콜 (http/https) 일치 확인
