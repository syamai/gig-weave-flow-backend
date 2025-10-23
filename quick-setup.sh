#!/bin/bash

# ===========================================
# Gig Weave Flow Backend - 빠른 설정 도우미
# ===========================================

echo "🚀 Gig Weave Flow Backend - 빠른 설정"
echo "===================================="

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 현재 디렉토리 확인
if [ ! -f "package.json" ]; then
    echo "❌ package.json을 찾을 수 없습니다. 백엔드 디렉토리에서 실행해주세요."
    exit 1
fi

print_step "환경 설정을 시작합니다..."

# 1. .env 파일 생성
if [ ! -f ".env" ]; then
    print_step ".env 파일을 생성합니다..."
    cp env.example .env
    print_success ".env 파일 생성 완료"
else
    print_warning ".env 파일이 이미 존재합니다."
fi

# 2. 의존성 설치
print_step "의존성을 설치합니다..."
npm install
print_success "의존성 설치 완료"

# 3. Prisma 클라이언트 생성
print_step "Prisma 클라이언트를 생성합니다..."
npx prisma generate
print_success "Prisma 클라이언트 생성 완료"

print_success "🎉 기본 설정이 완료되었습니다!"
echo ""
echo "📋 다음 단계:"
echo "1. Supabase 프로젝트 생성: https://supabase.com"
echo "2. .env 파일에서 DATABASE_URL 업데이트"
echo "3. ./setup-supabase.sh 실행 (자동 설정)"
echo "   또는"
echo "4. 수동으로 .env 파일 편집 후 npm run dev"
echo ""
echo "📚 도움말:"
echo "- 자동 설정: ./setup-supabase.sh"
echo "- 수동 설정: SUPABASE_RESET_GUIDE.md"
echo "- 환경변수 설정: ENV_SETUP.md"
