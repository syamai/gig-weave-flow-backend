#!/bin/bash

# ===========================================
# Gig Weave Flow Backend - Supabase 설정 스크립트
# ===========================================

echo "🚀 Gig Weave Flow Backend - Supabase 설정을 시작합니다"
echo "=================================================="

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 함수 정의
print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1단계: 환경 확인
print_step "1단계: 환경 확인"
echo "현재 디렉토리: $(pwd)"
echo "Node.js 버전: $(node --version)"
echo "npm 버전: $(npm --version)"

# .env 파일 확인
if [ -f .env ]; then
    print_warning ".env 파일이 이미 존재합니다. 백업을 생성합니다."
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    print_success "백업 파일 생성 완료"
else
    print_step ".env 파일을 생성합니다."
    cp env.example .env
    print_success ".env 파일 생성 완료"
fi

# 2단계: Supabase 프로젝트 생성 안내
print_step "2단계: Supabase 프로젝트 생성"
echo ""
echo "다음 단계를 수행하세요:"
echo "1. https://supabase.com 접속"
echo "2. 'Start your project' 클릭"
echo "3. GitHub 계정으로 로그인"
echo "4. 새 프로젝트 생성:"
echo "   - Project Name: gig-weave-flow"
echo "   - Database Password: 강력한 비밀번호 설정"
echo "   - Region: Northeast Asia (Seoul)"
echo ""

# 사용자 입력 대기
read -p "Supabase 프로젝트 생성이 완료되었습니까? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Supabase 프로젝트를 먼저 생성해주세요."
    exit 1
fi

# 3단계: 연결 정보 입력
print_step "3단계: Supabase 연결 정보 입력"

echo ""
echo "Supabase 대시보드에서 다음 정보를 복사해주세요:"
echo "1. Settings → Database → Connection string (URI)"
echo "2. Settings → API → Project URL"
echo "3. Settings → API → anon public key"
echo "4. Settings → API → service_role key"
echo ""

# DATABASE_URL 입력
read -p "DATABASE_URL을 입력하세요: " DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL이 입력되지 않았습니다."
    exit 1
fi

# SUPABASE_URL 입력
read -p "SUPABASE_URL을 입력하세요: " SUPABASE_URL
if [ -z "$SUPABASE_URL" ]; then
    print_error "SUPABASE_URL이 입력되지 않았습니다."
    exit 1
fi

# SUPABASE_ANON_KEY 입력
read -p "SUPABASE_ANON_KEY을 입력하세요: " SUPABASE_ANON_KEY
if [ -z "$SUPABASE_ANON_KEY" ]; then
    print_error "SUPABASE_ANON_KEY이 입력되지 않았습니다."
    exit 1
fi

# SUPABASE_SERVICE_ROLE_KEY 입력
read -p "SUPABASE_SERVICE_ROLE_KEY을 입력하세요: " SUPABASE_SERVICE_ROLE_KEY
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    print_error "SUPABASE_SERVICE_ROLE_KEY이 입력되지 않았습니다."
    exit 1
fi

# 4단계: .env 파일 업데이트
print_step "4단계: .env 파일 업데이트"

# .env 파일에서 값들 업데이트
sed -i.bak "s|DATABASE_URL=.*|DATABASE_URL=\"$DATABASE_URL\"|g" .env
sed -i.bak "s|SUPABASE_URL=.*|SUPABASE_URL=\"$SUPABASE_URL\"|g" .env
sed -i.bak "s|SUPABASE_ANON_KEY=.*|SUPABASE_ANON_KEY=\"$SUPABASE_ANON_KEY\"|g" .env
sed -i.bak "s|SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=\"$SUPABASE_SERVICE_ROLE_KEY\"|g" .env

# JWT_SECRET 생성 (강력한 랜덤 키)
JWT_SECRET=$(openssl rand -base64 32)
sed -i.bak "s|JWT_SECRET=.*|JWT_SECRET=\"$JWT_SECRET\"|g" .env

print_success ".env 파일 업데이트 완료"

# 5단계: 의존성 설치
print_step "5단계: 의존성 설치"
npm install
print_success "의존성 설치 완료"

# 6단계: Prisma 설정
print_step "6단계: Prisma 설정"
npx prisma generate
print_success "Prisma 클라이언트 생성 완료"

# 7단계: 데이터베이스 마이그레이션
print_step "7단계: 데이터베이스 마이그레이션"
npx prisma migrate deploy
print_success "데이터베이스 마이그레이션 완료"

# 8단계: 연결 테스트
print_step "8단계: 연결 테스트"

# 서버를 백그라운드에서 시작
print_step "서버를 시작합니다..."
npm run dev &
SERVER_PID=$!

# 서버 시작 대기
sleep 5

# 헬스체크 테스트
print_step "API 헬스체크 테스트"
if curl -s http://localhost:3001/api/health > /dev/null; then
    print_success "API 서버가 정상적으로 실행 중입니다"
else
    print_error "API 서버 연결 실패"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

# 사용자 등록 테스트
print_step "사용자 등록 테스트"
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","fullName":"Test User","role":"client"}')

if echo "$REGISTER_RESPONSE" | grep -q "success.*true"; then
    print_success "사용자 등록 테스트 성공"
else
    print_warning "사용자 등록 테스트 실패 (이미 존재하는 사용자일 수 있음)"
fi

# 서버 종료
kill $SERVER_PID 2>/dev/null

# 9단계: 완료 메시지
print_success "🎉 Supabase 설정이 완료되었습니다!"
echo ""
echo "📋 설정된 정보:"
echo "- DATABASE_URL: $DATABASE_URL"
echo "- SUPABASE_URL: $SUPABASE_URL"
echo "- JWT_SECRET: $JWT_SECRET"
echo ""
echo "🚀 다음 단계:"
echo "1. npm run dev로 서버 시작"
echo "2. http://localhost:3001/api/health로 API 확인"
echo "3. http://localhost:3001/api-docs로 Swagger UI 확인"
echo "4. Railway에 배포 진행"
echo ""
echo "📚 참고 문서:"
echo "- API 문서: API_DOCS.md"
echo "- 배포 가이드: DEPLOYMENT.md"
echo "- 테스트 결과: TEST_RESULTS.md"
