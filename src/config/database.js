const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
const config = require('./index');

// 환경 변수 검증
const supabaseUrl = process.env.SUPABASE_URL || 'https://xmeuypaqqtqcvkryygjo.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY 또는 SUPABASE_ANON_KEY가 설정되지 않았습니다.');
  console.error('💡 Railway 대시보드에서 환경 변수를 설정하세요.');
  process.exit(1);
}

// Supabase 클라이언트 생성
const supabase = createClient(supabaseUrl, supabaseKey);

// Prisma 클라이언트 생성
const prisma = new PrismaClient();

// Database connection test
const connectDB = async () => {
  try {
    // Supabase 연결 테스트
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116은 테이블이 없을 때 발생
      throw error;
    }
    
    console.log('✅ Supabase connected successfully');
    console.log(`📊 Database URL: ${config.databaseUrl ? 'Set' : 'Not set'}`);
    console.log(`🔑 Supabase URL: ${process.env.SUPABASE_URL ? 'Set' : 'Not set'}`);
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    console.log('💡 Make sure to set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
    process.exit(1);
  }
};

// Graceful shutdown
const disconnectDB = async () => {
  try {
    console.log('✅ Supabase disconnected successfully');
  } catch (error) {
    console.error('❌ Supabase disconnection failed:', error);
  }
};

module.exports = {
  supabase,
  prisma,
  connectDB,
  disconnectDB
};
