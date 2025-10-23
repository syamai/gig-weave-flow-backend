// MCP를 통한 데이터베이스 스키마 설정
const SupabaseMCPClient = require('../integrations/supabase/mcp-client');
const fs = require('fs');
const path = require('path');

class DatabaseSetup {
  constructor() {
    this.mcpClient = new SupabaseMCPClient();
  }

  // 데이터베이스 연결 테스트
  async testConnection() {
    console.log('🔍 MCP Supabase 연결 테스트 중...');
    const result = await this.mcpClient.testConnection();
    
    if (result.success) {
      console.log('✅ MCP Supabase 연결 성공!');
      return true;
    } else {
      console.error('❌ MCP Supabase 연결 실패:', result.error);
      return false;
    }
  }

  // SQL 스키마 파일 읽기
  readSchemaFile() {
    const schemaPath = path.join(__dirname, 'schema.sql');
    return fs.readFileSync(schemaPath, 'utf8');
  }

  // 데이터베이스 스키마 생성
  async createSchema() {
    console.log('📋 데이터베이스 스키마 생성 중...');
    
    try {
      const schema = this.readSchemaFile();
      const result = await this.mcpClient.executeSQL(schema);
      
      if (result.success) {
        console.log('✅ 데이터베이스 스키마 생성 완료!');
        return true;
      } else {
        console.error('❌ 스키마 생성 실패:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ 스키마 생성 중 오류:', error.message);
      return false;
    }
  }

  // 기본 데이터 삽입
  async insertSeedData() {
    console.log('🌱 기본 데이터 삽입 중...');
    
    try {
      // 기술 스택 데이터
      const techStacks = [
        { name: 'React', category: 'Frontend', description: 'JavaScript UI library' },
        { name: 'Node.js', category: 'Backend', description: 'JavaScript runtime' },
        { name: 'PostgreSQL', category: 'Database', description: 'Relational database' },
        { name: 'TypeScript', category: 'Language', description: 'Typed JavaScript' },
        { name: 'Next.js', category: 'Framework', description: 'React framework' },
        { name: 'Express', category: 'Backend', description: 'Node.js web framework' },
        { name: 'MongoDB', category: 'Database', description: 'NoSQL database' },
        { name: 'Docker', category: 'DevOps', description: 'Containerization' },
        { name: 'AWS', category: 'Cloud', description: 'Amazon Web Services' },
        { name: 'Supabase', category: 'Backend', description: 'Backend as a Service' }
      ];

      for (const tech of techStacks) {
        const result = await this.mcpClient.insert('tech_stacks', tech);
        if (!result.success) {
          console.warn(`⚠️ 기술 스택 삽입 실패: ${tech.name}`, result.error);
        }
      }

      console.log('✅ 기본 데이터 삽입 완료!');
      return true;
    } catch (error) {
      console.error('❌ 기본 데이터 삽입 중 오류:', error.message);
      return false;
    }
  }

  // 전체 설정 실행
  async setup() {
    console.log('🚀 MCP Supabase 데이터베이스 설정 시작...\n');
    
    // 1. 연결 테스트
    const connectionOk = await this.testConnection();
    if (!connectionOk) {
      console.error('❌ 연결 실패로 인해 설정을 중단합니다.');
      return false;
    }
    
    console.log('');
    
    // 2. 스키마 생성
    const schemaOk = await this.createSchema();
    if (!schemaOk) {
      console.error('❌ 스키마 생성 실패로 인해 설정을 중단합니다.');
      return false;
    }
    
    console.log('');
    
    // 3. 기본 데이터 삽입
    const seedOk = await this.insertSeedData();
    if (!seedOk) {
      console.warn('⚠️ 기본 데이터 삽입에 실패했지만 계속 진행합니다.');
    }
    
    console.log('\n🎉 MCP Supabase 데이터베이스 설정 완료!');
    return true;
  }

  // 테이블 목록 조회
  async listTables() {
    try {
      const result = await this.mcpClient.executeSQL(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `);
      
      if (result.success) {
        console.log('📋 데이터베이스 테이블 목록:');
        result.data.forEach(table => {
          console.log(`  - ${table.table_name}`);
        });
        return result.data;
      } else {
        console.error('❌ 테이블 목록 조회 실패:', result.error);
        return [];
      }
    } catch (error) {
      console.error('❌ 테이블 목록 조회 중 오류:', error.message);
      return [];
    }
  }
}

module.exports = DatabaseSetup;
