const { createClient } = require('@supabase/supabase-js');
const config = require('./index');

// Supabase 클라이언트 생성
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://xmeuypaqqtqcvkryygjo.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

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
  connectDB,
  disconnectDB
};
