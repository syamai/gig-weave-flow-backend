#!/usr/bin/env node

// 최소한의 Supabase 스키마 생성
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function createMinimalSchema() {
  console.log('🔧 최소한의 Supabase 스키마 생성 중...\n');

  const supabaseUrl = process.env.SUPABASE_URL || 'https://xmeuypaqqtqcvkryygjo.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ 환경 변수가 설정되지 않았습니다.');
    process.exit(1);
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase 클라이언트 생성 완료');

    // 최소한의 users 테이블 생성
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    console.log('📊 users 테이블 생성 중...');
    
    // Supabase에서 직접 SQL 실행 시도
    const { data, error } = await supabase.rpc('exec', {
      sql: createUsersTable
    });

    if (error) {
      console.log('⚠️  RPC exec 실패, 다른 방법 시도 중...');
      
      // 다른 방법으로 테이블 존재 확인
      const { data: testData, error: testError } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      if (testError && testError.code === 'PGRST116') {
        console.log('❌ users 테이블이 존재하지 않습니다.');
        console.log('💡 Supabase 대시보드에서 수동으로 스키마를 생성해야 합니다.');
        console.log('\n📋 생성할 SQL:');
        console.log(createUsersTable);
      } else if (testError) {
        throw testError;
      } else {
        console.log('✅ users 테이블이 이미 존재합니다!');
      }
    } else {
      console.log('✅ users 테이블 생성 성공!');
    }

    // 연결 테스트
    console.log('\n🔍 연결 테스트 중...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (usersError) {
      console.log('❌ 연결 테스트 실패:', usersError.message);
    } else {
      console.log('✅ 연결 테스트 성공!');
      console.log('🎉 Supabase가 정상적으로 작동합니다.');
    }

  } catch (error) {
    console.error('❌ 스키마 생성 실패:', error.message);
    console.log('\n💡 해결 방법:');
    console.log('   1. Supabase 대시보드에서 SQL Editor 사용');
    console.log('   2. SUPABASE_SCHEMA_SETUP.md 파일의 SQL 실행');
  }
}

createMinimalSchema();
