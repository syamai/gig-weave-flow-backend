#!/usr/bin/env node

// Supabase 연결 테스트 스크립트
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testSupabaseConnection() {
  console.log('🔍 Supabase 연결 테스트 시작...\n');

  // 환경 변수 확인
  const supabaseUrl = process.env.SUPABASE_URL || 'https://xmeuypaqqtqcvkryygjo.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  console.log('📋 환경 변수 확인:');
  console.log(`   SUPABASE_URL: ${supabaseUrl ? '✅ 설정됨' : '❌ 설정되지 않음'}`);
  console.log(`   SUPABASE_KEY: ${supabaseKey ? '✅ 설정됨' : '❌ 설정되지 않음'}\n`);

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase URL 또는 Key가 설정되지 않았습니다.');
    console.log('💡 .env 파일에 다음을 추가하세요:');
    console.log('   SUPABASE_URL=https://your-project.supabase.co');
    console.log('   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
    process.exit(1);
  }

  try {
    // Supabase 클라이언트 생성
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('🔗 Supabase 클라이언트 생성 완료');

    // 연결 테스트 - 간단한 쿼리 실행
    console.log('📡 데이터베이스 연결 테스트 중...');
    
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('⚠️  users 테이블이 존재하지 않습니다. (정상 - 아직 스키마가 생성되지 않음)');
      } else {
        throw error;
      }
    } else {
      console.log('✅ users 테이블 연결 성공');
    }

    // 스키마 정보 확인
    console.log('\n📊 스키마 정보 확인 중...');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_schema_tables');

    if (tablesError) {
      console.log('⚠️  스키마 정보를 가져올 수 없습니다. (정상 - 아직 스키마가 생성되지 않음)');
    } else {
      console.log('✅ 스키마 정보 확인 완료');
      console.log('📋 생성된 테이블:', tables);
    }

    console.log('\n🎉 Supabase 연결 테스트 완료!');
    console.log('✅ 데이터베이스 연결이 정상적으로 작동합니다.');

  } catch (error) {
    console.error('\n❌ Supabase 연결 실패:');
    console.error('   에러:', error.message);
    console.error('   코드:', error.code);
    
    console.log('\n💡 해결 방법:');
    console.log('   1. Supabase 프로젝트가 활성화되어 있는지 확인');
    console.log('   2. SUPABASE_URL이 올바른지 확인');
    console.log('   3. SUPABASE_SERVICE_ROLE_KEY가 올바른지 확인');
    console.log('   4. Supabase 프로젝트의 API 설정을 확인');
    
    process.exit(1);
  }
}

// 스크립트 실행
testSupabaseConnection();
