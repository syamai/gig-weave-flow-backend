# 🚀 Supabase 스키마 설정 가이드

## 현재 상태
- ✅ Supabase 연결 성공
- ✅ API 키 유효
- ❌ 데이터베이스 스키마(테이블) 없음

## 해결 방법

### 1. essential-tables.sql 파일 사용

프로젝트 루트에 있는 `essential-tables.sql` 파일을 사용하여 스키마를 생성하세요.

### 2. Supabase 대시보드에서 스키마 생성

1. **Supabase 대시보드 접속**: https://supabase.com/dashboard
2. **프로젝트 선택**: 해당 프로젝트 선택
3. **SQL Editor 이동**: 왼쪽 메뉴에서 "SQL Editor" 클릭
4. **새 쿼리 생성**: "New query" 버튼 클릭
5. **스키마 실행**: `essential-tables.sql` 파일의 내용을 복사하여 실행

### 3. essential-tables.sql 파일 내용

이 파일에는 다음이 포함되어 있습니다:
- 모든 필요한 테이블 생성
- 인덱스 생성
- RLS (Row Level Security) 정책 설정
- 업데이트 트리거 함수
- 초기 데이터 (기술 스택 등)

### 4. 스키마 생성 후 확인

스키마 생성이 완료되면 다음 명령어로 확인:

```bash
npm start
```

### 5. Railway 배포 시 환경 변수 설정

Railway 대시보드에서 다음 환경 변수들을 설정하세요:

```bash
# Supabase 설정
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key
SUPABASE_ANON_KEY=your-actual-anon-key

# JWT 설정
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# 서버 설정
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-frontend-domain.com
```

## 완료 후 확인

스키마 생성이 완료되면:
- ✅ 서버가 정상적으로 시작됨
- ✅ `/api/health` 엔드포인트 응답
- ✅ Supabase 데이터베이스 연결 성공
- ✅ 모든 테이블이 생성됨
- ✅ RLS 정책이 적용됨

## 생성되는 테이블 목록

### 핵심 테이블
- `users` - 사용자 정보
- `profiles` - 프로필 정보
- `projects` - 프로젝트
- `proposals` - 제안서
- `contracts` - 계약
- `messages` - 메시지
- `notifications` - 알림

### 지원 테이블
- `tech_stacks` - 기술 스택
- `portfolios` - 포트폴리오
- `reviews` - 리뷰
- `file_uploads` - 파일 업로드
- `project_tech_stacks` - 프로젝트-기술스택 연결
- `portfolio_tech_stacks` - 포트폴리오-기술스택 연결

## RLS (Row Level Security) 정책

모든 테이블에 대해 적절한 RLS 정책이 설정됩니다:
- 사용자는 자신의 데이터만 조회/수정 가능
- 공개 데이터는 모든 사용자가 조회 가능
- 관리자 권한이 필요한 작업은 적절히 제한

## 문제 해결

### 스키마 생성 실패
1. **확인사항**: Supabase 프로젝트가 활성화되어 있는지 확인
2. **해결방법**: `essential-tables.sql`을 다시 실행

### 권한 오류
1. **확인사항**: `SUPABASE_SERVICE_ROLE_KEY`가 올바른지 확인
2. **해결방법**: Supabase에서 서비스 역할 키 다시 복사

### 테이블이 생성되지 않음
1. **확인사항**: SQL 실행 시 오류가 발생했는지 확인
2. **해결방법**: Supabase SQL Editor에서 오류 메시지 확인 후 수정

## 다음 단계

스키마 생성이 완료되면:
1. **API 테스트**: `/api/health` 엔드포인트 확인
2. **사용자 등록 테스트**: `/api/auth/register` 엔드포인트 테스트
3. **프론트엔드 연결**: 프론트엔드에서 API 호출 테스트