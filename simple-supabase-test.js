#!/usr/bin/env node

// 간단한 Supabase 연결 테스트
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testSupabaseConnection() {
  console.log('🔍 Supabase 연결 테스트 (간단 버전)...\n');

  const supabaseUrl = process.env.SUPABASE_URL || 'https://xmeuypaqqtqcvkryygjo.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  console.log('📋 환경 변수:');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Key: ${supabaseKey ? '설정됨' : '설정되지 않음'}\n`);

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase 클라이언트 생성 완료');

    // 간단한 연결 테스트 - auth 정보 확인
    console.log('🔐 인증 정보 확인 중...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('⚠️  인증 에러 (정상 - 서비스 키 사용):', authError.message);
    } else {
      console.log('✅ 인증 확인 완료');
    }

    // 데이터베이스 연결 테스트 - 간단한 쿼리
    console.log('📡 데이터베이스 연결 테스트 중...');
    
    // 시스템 테이블 조회 시도
    const { data, error } = await supabase
      .from('pg_tables')
      .select('tablename')
      .limit(5);

    if (error) {
      console.log('⚠️  시스템 테이블 조회 실패 (정상):', error.message);
      
      // 다른 방법으로 연결 테스트
      console.log('🔄 대체 방법으로 연결 테스트 중...');
      
      // 빈 쿼리로 연결 테스트
      const { data: testData, error: testError } = await supabase
        .from('non_existent_table')
        .select('*')
        .limit(1);

      if (testError && testError.code === 'PGRST116') {
        console.log('✅ 데이터베이스 연결 성공! (테이블이 없어서 정상적인 에러)');
      } else {
        throw testError;
      }
    } else {
      console.log('✅ 데이터베이스 연결 성공!');
      console.log('📋 사용 가능한 테이블:', data.map(t => t.tablename));
    }

    console.log('\n🎉 Supabase 연결 테스트 완료!');
    console.log('✅ 데이터베이스가 정상적으로 작동합니다.');
    console.log('💡 이제 스키마를 생성할 수 있습니다.');

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

testSupabaseConnection();
