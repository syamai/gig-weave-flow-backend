# 🚀 Supabase 스키마 설정 가이드

## 현재 상태
- ✅ Supabase 연결 성공
- ✅ API 키 유효
- ❌ 데이터베이스 스키마(테이블) 없음

## 해결 방법

### 1. Supabase 대시보드에서 스키마 생성

1. **Supabase 대시보드 접속**: https://supabase.com/dashboard
2. **프로젝트 선택**: `xmeuypaqqtqcvkryygjo`
3. **SQL Editor 이동**: 왼쪽 메뉴에서 "SQL Editor" 클릭
4. **새 쿼리 생성**: "New query" 버튼 클릭
5. **스키마 실행**: 아래 SQL을 복사하여 실행

```sql
-- 사용자 테이블 생성
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 프로필 테이블 생성
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  skills TEXT[],
  hourly_rate DECIMAL(10,2),
  availability VARCHAR(50) DEFAULT 'available',
  location VARCHAR(255),
  website_url TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 프로젝트 테이블 생성
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  budget DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  category VARCHAR(100),
  skills_required TEXT[],
  deadline DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- RLS (Row Level Security) 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Projects are viewable by everyone" ON projects FOR SELECT USING (true);
CREATE POLICY "Users can insert own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = client_id);
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = client_id);
```

### 2. 스키마 생성 후 확인

스키마 생성이 완료되면 다음 명령어로 확인:

```bash
npm start
```

### 3. Railway 배포 시 환경 변수 설정

Railway 대시보드에서 다음 환경 변수들을 설정하세요:

```bash
SUPABASE_URL=https://xmeuypaqqtqcvkryygjo.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xmeuypaqqtqcvkryygjo.supabase.co:5432/postgres
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
SOCKET_CORS_ORIGIN=https://your-frontend-domain.com
```

## 완료 후 확인

스키마 생성이 완료되면:
- ✅ 서버가 정상적으로 시작됨
- ✅ `/api/health` 엔드포인트 응답
- ✅ Supabase 데이터베이스 연결 성공
