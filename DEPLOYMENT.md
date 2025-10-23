# 🚀 백엔드 배포 가이드 (Supabase + Railway)

## Supabase 데이터베이스 설정

### 1. Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com)에 접속하여 계정 생성
2. "New Project" 클릭
3. 프로젝트 이름: `gig-weave-flow`
4. 데이터베이스 비밀번호 설정
5. 지역 선택 (가장 가까운 지역)

### 2. Supabase 데이터베이스 설정

1. Supabase 대시보드에서 "Settings" → "Database" 이동
2. "Connection string" 섹션에서 "URI" 복사
3. 연결 문자열 형식:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```

### 3. Supabase에서 데이터베이스 스키마 생성

Supabase SQL Editor에서 다음 명령어 실행:

```sql
-- Prisma 마이그레이션 실행
-- (Railway 배포 후 자동으로 실행됨)
```

## Railway 배포 방법

### 1. Railway 계정 생성 및 프로젝트 생성

1. [Railway.app](https://railway.app)에 접속하여 계정 생성
2. "New Project" 클릭
3. "Deploy from GitHub repo" 선택
4. GitHub 저장소 연결

### 2. 환경변수 설정

Railway 대시보드에서 다음 환경변수들을 설정하세요:

#### 필수 환경변수
```bash
# 데이터베이스 (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# JWT 설정
JWT_SECRET=your-super-secret-jwt-key-here-change-in-production
JWT_EXPIRES_IN=7d

# 서버 설정
PORT=3001
NODE_ENV=production

# CORS 설정
FRONTEND_URL=https://your-frontend-domain.com
SOCKET_CORS_ORIGIN=https://your-frontend-domain.com

# 파일 업로드
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### 선택적 환경변수
```bash
# 이메일 (선택사항)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 3. 배포 실행

1. GitHub 저장소와 연결되면 자동으로 배포가 시작됩니다
2. 배포 로그를 확인하여 성공적으로 배포되었는지 확인하세요
3. 배포 완료 후 제공되는 URL로 API에 접근할 수 있습니다

### 4. 데이터베이스 마이그레이션

배포 후 Railway 터미널에서 다음 명령어를 실행하세요:

```bash
npx prisma migrate deploy
```

또는 Supabase SQL Editor에서 직접 실행할 수도 있습니다.

### 5. Supabase 설정 확인

1. Supabase 대시보드에서 "Table Editor" 확인
2. 모든 테이블이 생성되었는지 확인
3. "Authentication" → "Users"에서 사용자 관리 확인

### 6. 배포 확인

배포된 API의 상태를 확인하세요:

```bash
curl https://your-railway-app.railway.app/api/health
```

Swagger UI 접근:
```
https://your-railway-app.railway.app/api-docs
```

### 7. Supabase 연동 테스트

1. **사용자 등록 테스트**:
   ```bash
   curl -X POST https://your-railway-app.railway.app/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123","fullName":"Test User","role":"client"}'
   ```

2. **데이터베이스 연결 확인**:
   - Supabase 대시보드에서 `profiles` 테이블 확인
   - 새로 생성된 사용자 데이터 확인

## 🔧 로컬에서 Railway CLI 사용

### Railway CLI 설치
```bash
npm install -g @railway/cli
```

### 로그인 및 배포
```bash
# 로그인
railway login

# 프로젝트 초기화
railway init

# 환경변수 설정
railway variables set JWT_SECRET=your-secret-key
railway variables set NODE_ENV=production

# 배포
railway up
```

## 📊 모니터링

### Railway 대시보드
- CPU, 메모리 사용량 모니터링
- 로그 실시간 확인
- 환경변수 관리
- 도메인 설정

### 헬스체크
- 엔드포인트: `/api/health`
- 상태: 200 OK
- 응답 시간 모니터링

## 🚨 문제 해결

### 일반적인 문제들

1. **데이터베이스 연결 실패**
   - `DATABASE_URL` 환경변수 확인 (Supabase 연결 문자열)
   - Supabase 프로젝트 상태 확인
   - 데이터베이스 비밀번호 확인

2. **Supabase 연결 문제**
   - Supabase 프로젝트가 활성화되어 있는지 확인
   - 연결 문자열 형식 확인: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
   - Supabase 대시보드에서 연결 상태 확인

3. **JWT 토큰 오류**
   - `JWT_SECRET` 환경변수 확인
   - 토큰 만료 시간 설정 확인

4. **CORS 오류**
   - `FRONTEND_URL` 환경변수 확인
   - `SOCKET_CORS_ORIGIN` 설정 확인

5. **파일 업로드 실패**
   - `UPLOAD_DIR` 권한 확인
   - `MAX_FILE_SIZE` 설정 확인

6. **Prisma 마이그레이션 실패**
   - Supabase 데이터베이스 권한 확인
   - 마이그레이션 파일 상태 확인
   - `npx prisma migrate reset` 후 재시도

### 로그 확인
```bash
# Railway CLI로 로그 확인
railway logs

# 특정 서비스 로그
railway logs --service your-service-name
```

## 🔄 자동 배포 설정

GitHub 저장소와 연결하면 `main` 브랜치에 푸시할 때마다 자동으로 배포됩니다.

### 브랜치별 배포
- `main`: 프로덕션 환경
- `develop`: 개발 환경 (선택사항)

## 📈 성능 최적화

### Railway 권장사항
- Node.js 18+ 사용
- 메모리 사용량 모니터링
- 데이터베이스 연결 풀링
- 정적 파일 CDN 사용 고려

### Supabase 최적화
- **연결 풀링**: Prisma가 자동으로 관리
- **인덱스**: 자주 조회되는 컬럼에 인덱스 설정
- **쿼리 최적화**: Supabase 대시보드에서 쿼리 성능 모니터링
- **백업**: Supabase 자동 백업 활용

### 환경별 설정
- **개발**: 디버그 로그 활성화
- **프로덕션**: 로그 레벨 최소화, 압축 활성화

## 🔗 Supabase 추가 기능

### 1. 실시간 구독 (Supabase Realtime)
```javascript
// 프론트엔드에서 Supabase Realtime 사용
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://your-project.supabase.co',
  'your-anon-key'
)

// 실시간 구독
supabase
  .channel('projects')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'projects' },
    (payload) => console.log('New project:', payload.new)
  )
  .subscribe()
```

### 2. 인증 (Supabase Auth)
```javascript
// 사용자 등록
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
})

// 사용자 로그인
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})
```

### 3. 파일 스토리지 (Supabase Storage)
```javascript
// 파일 업로드
const { data, error } = await supabase.storage
  .from('avatars')
  .upload('public/avatar1.png', file)

// 파일 다운로드
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl('public/avatar1.png')
```
