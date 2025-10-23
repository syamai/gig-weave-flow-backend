# 🔄 Supabase 재설정 가이드

## 🚀 단계별 Supabase 설정

### 1단계: Supabase 계정 및 프로젝트 생성

#### 1.1 Supabase 웹사이트 접속
1. [supabase.com](https://supabase.com) 접속
2. "Start your project" 클릭
3. GitHub 계정으로 로그인

#### 1.2 새 프로젝트 생성
1. "New Project" 클릭
2. **Organization**: 개인 계정 선택
3. **Project Name**: `gig-weave-flow`
4. **Database Password**: 강력한 비밀번호 설정 (예: `GigWeave2024!Secure`)
5. **Region**: `Northeast Asia (Seoul)` 선택
6. "Create new project" 클릭

### 2단계: 프로젝트 정보 확인

#### 2.1 프로젝트 대시보드 접속
- 프로젝트 생성 완료 후 대시보드로 이동
- URL 형식: `https://[PROJECT-REF].supabase.co`

#### 2.2 연결 정보 복사
1. **Settings** → **Database** 이동
2. **Connection string** 섹션에서 **URI** 복사
3. 형식: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

#### 2.3 API 키 복사
1. **Settings** → **API** 이동
2. **Project URL** 복사: `https://[PROJECT-REF].supabase.co`
3. **anon public** 키 복사: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
4. **service_role** 키 복사: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3단계: 환경변수 업데이트

#### 3.1 .env 파일 편집
```bash
# 백엔드 디렉토리에서 실행
cd /Users/ahnsungbin/Source/gig-weave-flow/backend
nano .env
```

#### 3.2 필수 환경변수 업데이트
```bash
# 데이터베이스 연결
DATABASE_URL="postgresql://postgres:[YOUR-ACTUAL-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Supabase 설정
SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# JWT 설정 (강력한 키로 변경)
JWT_SECRET="your-super-secret-jwt-key-here-change-in-production"
JWT_EXPIRES_IN="7d"
```

### 4단계: 데이터베이스 스키마 설정

#### 4.1 Prisma 마이그레이션 실행
```bash
# 로컬에서 실행
cd /Users/ahnsungbin/Source/gig-weave-flow/backend
npx prisma migrate deploy
```

#### 4.2 데이터베이스 연결 테스트
```bash
# Prisma 스튜디오 실행 (선택사항)
npx prisma studio
```

### 5단계: 연결 테스트

#### 5.1 서버 시작
```bash
npm run dev
```

#### 5.2 API 테스트
```bash
# 헬스체크
curl http://localhost:3001/api/health

# 사용자 등록 테스트
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","fullName":"Test User","role":"client"}'
```

#### 5.3 Supabase 대시보드 확인
1. **Table Editor**에서 `profiles` 테이블 확인
2. 새로 생성된 사용자 데이터 확인

## 🔧 문제 해결

### 연결 실패
- **확인사항**: `DATABASE_URL` 형식이 올바른지 확인
- **해결방법**: Supabase 대시보드에서 연결 문자열 다시 복사

### 마이그레이션 실패
- **확인사항**: Supabase 프로젝트가 활성화되어 있는지 확인
- **해결방법**: 
  ```bash
  npx prisma migrate reset
  npx prisma migrate deploy
  ```

### 권한 오류
- **확인사항**: 데이터베이스 비밀번호가 올바른지 확인
- **해결방법**: Supabase에서 비밀번호 재설정

## 📊 설정 완료 확인 체크리스트

- [ ] Supabase 프로젝트 생성 완료
- [ ] 데이터베이스 연결 문자열 복사
- [ ] API 키들 복사
- [ ] .env 파일 업데이트
- [ ] Prisma 마이그레이션 실행
- [ ] 서버 시작 성공
- [ ] API 헬스체크 통과
- [ ] 사용자 등록 테스트 성공
- [ ] Supabase 대시보드에서 데이터 확인

## 🚀 다음 단계

설정이 완료되면:
1. **Railway 배포** 진행
2. **프론트엔드 연동** 준비
3. **프로덕션 환경** 설정
