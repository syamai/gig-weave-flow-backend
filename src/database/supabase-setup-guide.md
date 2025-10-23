# Supabase MCP 설정 가이드

## 1. Supabase 대시보드에서 스키마 생성

### SQL Editor 사용
1. Supabase 대시보드에 로그인
2. 프로젝트 선택: `xmeuypaqqtqcvkryygjo`
3. **SQL Editor** 메뉴로 이동
4. **New query** 클릭
5. `schema.sql` 파일의 내용을 복사하여 실행

### 또는 Migration 사용
1. **Database** → **Migrations** 메뉴로 이동
2. **New migration** 클릭
3. Migration 이름: `initial_schema`
4. `schema.sql` 파일의 내용을 복사하여 실행

## 2. 환경변수 확인

```bash
SUPABASE_URL="https://xmeuypaqqtqcvkryygjo.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 3. MCP 연결 테스트

```bash
cd /Users/ahnsungbin/Source/gig-weave-flow/backend
node -e "
const SupabaseMCPClient = require('./src/integrations/supabase/mcp-client');
const client = new SupabaseMCPClient();
client.testConnection().then(result => {
  console.log('연결 결과:', result);
});
"
```

## 4. 테이블 생성 후 확인

스키마 생성 후 다음 명령으로 테이블 목록을 확인할 수 있습니다:

```bash
node -e "
const DatabaseSetup = require('./src/database/mcp-setup');
const setup = new DatabaseSetup();
setup.listTables().then(tables => {
  console.log('생성된 테이블:', tables);
});
"
```

## 5. 기본 데이터 삽입

스키마 생성 후 기본 데이터를 삽입합니다:

```bash
node -e "
const DatabaseSetup = require('./src/database/mcp-setup');
const setup = new DatabaseSetup();
setup.insertSeedData().then(success => {
  console.log('기본 데이터 삽입:', success ? '성공' : '실패');
});
"
```

## 6. API 테스트

PostgREST API를 통한 테스트:

```bash
curl -H "apikey: YOUR_ANON_KEY" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     "https://xmeuypaqqtqcvkryygjo.supabase.co/rest/v1/users"
```

## 주의사항

- Supabase에서는 직접 SQL 실행이 제한적입니다
- 스키마 생성은 Supabase 대시보드에서 수행해야 합니다
- MCP는 주로 데이터 조작(CRUD)에 사용됩니다
- RLS(Row Level Security) 정책이 자동으로 적용됩니다
