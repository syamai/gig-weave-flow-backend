-- 필수 테이블 생성 SQL
-- Supabase SQL Editor에서 실행하세요

-- Users 테이블 (기본 사용자 정보) - Supabase Auth와 연동
-- Supabase Auth의 auth.users와 별도로 애플리케이션용 사용자 정보 저장
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('CLIENT', 'PARTNER', 'ADMIN')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 프로필 테이블
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

-- 프로젝트 테이블
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

-- 제안서 테이블
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  freelancer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  proposed_budget DECIMAL(10,2),
  estimated_duration INTEGER,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 메시지 테이블
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_proposals_project_id ON proposals(project_id);
CREATE INDEX IF NOT EXISTS idx_proposals_freelancer_id ON proposals(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);

-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성 (기존 정책이 있으면 무시)
DO $$ 
BEGIN
    -- 사용자 정책
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can view own data') THEN
        CREATE POLICY "Users can view own data" ON users FOR SELECT USING (email = auth.jwt() ->> 'email');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can update own data') THEN
        CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (email = auth.jwt() ->> 'email');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can insert own data') THEN
        CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (email = auth.jwt() ->> 'email');
    END IF;

    -- 프로필 정책
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Profiles are viewable by everyone') THEN
        CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
        CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile') THEN
        CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    -- 프로젝트 정책
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Projects are viewable by everyone') THEN
        CREATE POLICY "Projects are viewable by everyone" ON projects FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can insert own projects') THEN
        CREATE POLICY "Users can insert own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = client_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can update own projects') THEN
        CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = client_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can delete own projects') THEN
        CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = client_id);
    END IF;

    -- 제안서 정책
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'proposals' AND policyname = 'Proposals are viewable by related users') THEN
        CREATE POLICY "Proposals are viewable by related users" ON proposals FOR SELECT USING (
            auth.uid() = freelancer_id OR 
            auth.uid() IN (SELECT client_id FROM projects WHERE id = project_id)
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'proposals' AND policyname = 'Users can insert own proposals') THEN
        CREATE POLICY "Users can insert own proposals" ON proposals FOR INSERT WITH CHECK (auth.uid() = freelancer_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'proposals' AND policyname = 'Users can update own proposals') THEN
        CREATE POLICY "Users can update own proposals" ON proposals FOR UPDATE USING (auth.uid() = freelancer_id);
    END IF;

    -- 메시지 정책
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Messages are viewable by participants') THEN
        CREATE POLICY "Messages are viewable by participants" ON messages FOR SELECT USING (
            auth.uid() = sender_id OR auth.uid() = receiver_id
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can insert messages') THEN
        CREATE POLICY "Users can insert messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
    END IF;
END $$;

-- 계약 테이블
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  client_id UUID REFERENCES users(id) ON DELETE CASCADE,
  freelancer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
  contract_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'disputed')),
  start_date DATE,
  end_date DATE,
  terms TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 알림 테이블
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN DEFAULT false,
  related_id UUID,
  related_type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 리뷰 테이블
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reviewee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기술 스택 테이블
CREATE TABLE IF NOT EXISTS tech_stacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 파일 업로드 테이블
CREATE TABLE IF NOT EXISTS file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 추가 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_contracts_project_id ON contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_freelancer_id ON contracts(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_project_id ON reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_user_id ON file_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_project_id ON file_uploads(project_id);

-- 추가 RLS 활성화
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;

-- 추가 RLS 정책 생성 (기존 정책이 있으면 무시)
DO $$ 
BEGIN
    -- 계약 테이블 정책
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contracts' AND policyname = 'Contracts are viewable by participants') THEN
        CREATE POLICY "Contracts are viewable by participants" ON contracts FOR SELECT USING (
            auth.uid() = client_id OR auth.uid() = freelancer_id
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contracts' AND policyname = 'Users can insert contracts') THEN
        CREATE POLICY "Users can insert contracts" ON contracts FOR INSERT WITH CHECK (
            auth.uid() = client_id OR auth.uid() = freelancer_id
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contracts' AND policyname = 'Users can update contracts') THEN
        CREATE POLICY "Users can update contracts" ON contracts FOR UPDATE USING (
            auth.uid() = client_id OR auth.uid() = freelancer_id
        );
    END IF;

    -- 알림 테이블 정책
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Notifications are viewable by owner') THEN
        CREATE POLICY "Notifications are viewable by owner" ON notifications FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can update own notifications') THEN
        CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can insert notifications') THEN
        CREATE POLICY "Users can insert notifications" ON notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    -- 리뷰 테이블 정책
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Reviews are viewable by everyone') THEN
        CREATE POLICY "Reviews are viewable by everyone" ON reviews FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Users can insert reviews') THEN
        CREATE POLICY "Users can insert reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Users can update own reviews') THEN
        CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE USING (auth.uid() = reviewer_id);
    END IF;

    -- 파일 업로드 테이블 정책
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'file_uploads' AND policyname = 'Files are viewable by owner') THEN
        CREATE POLICY "Files are viewable by owner" ON file_uploads FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'file_uploads' AND policyname = 'Users can insert files') THEN
        CREATE POLICY "Users can insert files" ON file_uploads FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'file_uploads' AND policyname = 'Users can update own files') THEN
        CREATE POLICY "Users can update own files" ON file_uploads FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'file_uploads' AND policyname = 'Users can delete own files') THEN
        CREATE POLICY "Users can delete own files" ON file_uploads FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- 포트폴리오 테이블 (파트너 포트폴리오)
CREATE TABLE IF NOT EXISTS portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  image_urls TEXT[],
  tech_stack_ids UUID[],
  project_url TEXT,
  github_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 프로젝트-기술스택 연결 테이블 (다대다 관계)
CREATE TABLE IF NOT EXISTS project_tech_stacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  tech_stack_id UUID REFERENCES tech_stacks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, tech_stack_id)
);

-- 포트폴리오-기술스택 연결 테이블 (다대다 관계)
CREATE TABLE IF NOT EXISTS portfolio_tech_stacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
  tech_stack_id UUID REFERENCES tech_stacks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(portfolio_id, tech_stack_id)
);

-- 추가 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_portfolios_partner_id ON portfolios(partner_id);
CREATE INDEX IF NOT EXISTS idx_project_tech_stacks_project_id ON project_tech_stacks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tech_stacks_tech_stack_id ON project_tech_stacks(tech_stack_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_tech_stacks_portfolio_id ON portfolio_tech_stacks(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_tech_stacks_tech_stack_id ON portfolio_tech_stacks(tech_stack_id);

-- 추가 RLS 활성화
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tech_stacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_tech_stacks ENABLE ROW LEVEL SECURITY;

-- 추가 RLS 정책 생성
DO $$ 
BEGIN
    -- 포트폴리오 테이블 정책
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'portfolios' AND policyname = 'Portfolios are viewable by everyone') THEN
        CREATE POLICY "Portfolios are viewable by everyone" ON portfolios FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'portfolios' AND policyname = 'Users can manage own portfolios') THEN
        CREATE POLICY "Users can manage own portfolios" ON portfolios FOR ALL USING (auth.uid() = partner_id);
    END IF;

    -- 프로젝트-기술스택 연결 테이블 정책
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_tech_stacks' AND policyname = 'Project tech stacks are viewable by everyone') THEN
        CREATE POLICY "Project tech stacks are viewable by everyone" ON project_tech_stacks FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_tech_stacks' AND policyname = 'Users can manage project tech stacks') THEN
        CREATE POLICY "Users can manage project tech stacks" ON project_tech_stacks FOR ALL USING (
            auth.uid() IN (SELECT client_id FROM projects WHERE id = project_id)
        );
    END IF;

    -- 포트폴리오-기술스택 연결 테이블 정책
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'portfolio_tech_stacks' AND policyname = 'Portfolio tech stacks are viewable by everyone') THEN
        CREATE POLICY "Portfolio tech stacks are viewable by everyone" ON portfolio_tech_stacks FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'portfolio_tech_stacks' AND policyname = 'Users can manage portfolio tech stacks') THEN
        CREATE POLICY "Users can manage portfolio tech stacks" ON portfolio_tech_stacks FOR ALL USING (
            auth.uid() IN (SELECT partner_id FROM portfolios WHERE id = portfolio_id)
        );
    END IF;
END $$;

-- 기본 기술 스택 데이터 삽입
INSERT INTO tech_stacks (name, category, description) VALUES
('React', 'Frontend', 'A JavaScript library for building user interfaces'),
('Vue.js', 'Frontend', 'A progressive JavaScript framework'),
('Angular', 'Frontend', 'A platform for building mobile and desktop web applications'),
('Node.js', 'Backend', 'A JavaScript runtime built on Chrome''s V8 JavaScript engine'),
('Express.js', 'Backend', 'A fast, unopinionated, minimalist web framework for Node.js'),
('Python', 'Backend', 'A high-level programming language'),
('Django', 'Backend', 'A high-level Python web framework'),
('Flask', 'Backend', 'A lightweight Python web framework'),
('PostgreSQL', 'Database', 'A powerful, open source object-relational database system'),
('MongoDB', 'Database', 'A document-oriented NoSQL database'),
('Redis', 'Database', 'An in-memory data structure store'),
('Docker', 'DevOps', 'A platform for developing, shipping, and running applications'),
('Kubernetes', 'DevOps', 'An open-source container orchestration system'),
('AWS', 'Cloud', 'Amazon Web Services cloud platform'),
('Google Cloud', 'Cloud', 'Google Cloud Platform'),
('Azure', 'Cloud', 'Microsoft Azure cloud platform'),
('TypeScript', 'Language', 'A typed superset of JavaScript'),
('JavaScript', 'Language', 'A high-level programming language'),
('Java', 'Language', 'A general-purpose programming language'),
('Go', 'Language', 'An open source programming language'),
('Rust', 'Language', 'A systems programming language'),
('PHP', 'Language', 'A popular general-purpose scripting language'),
('Laravel', 'Backend', 'A PHP web application framework'),
('Ruby on Rails', 'Backend', 'A web application framework written in Ruby'),
('Swift', 'Mobile', 'A programming language for iOS development'),
('Kotlin', 'Mobile', 'A programming language for Android development'),
('React Native', 'Mobile', 'A framework for building native apps using React'),
('Flutter', 'Mobile', 'A UI toolkit for building natively compiled applications'),
('Next.js', 'Frontend', 'A React framework for production'),
('Nuxt.js', 'Frontend', 'A Vue.js framework for production'),
('Svelte', 'Frontend', 'A component framework for building user interfaces'),
('GraphQL', 'API', 'A query language and runtime for APIs'),
('REST API', 'API', 'Representational State Transfer architectural style'),
('WebSocket', 'API', 'A computer communications protocol'),
('Jest', 'Testing', 'A JavaScript testing framework'),
('Cypress', 'Testing', 'A front-end testing tool'),
('Selenium', 'Testing', 'A web browser automation tool'),
('Git', 'Version Control', 'A distributed version control system'),
('GitHub', 'Version Control', 'A web-based Git repository hosting service'),
('GitLab', 'Version Control', 'A web-based Git repository manager')
ON CONFLICT (name) DO NOTHING;

-- 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 업데이트 트리거 생성
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON proposals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON portfolios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
