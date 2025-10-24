#!/usr/bin/env node

// 상세한 스키마 일치 여부 확인
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function detailedSchemaCheck() {
  console.log('🔍 상세한 스키마 일치 여부 확인...\n');

  const supabaseUrl = process.env.SUPABASE_URL || 'https://xmeuypaqqtqcvkryygjo.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.');
    process.exit(1);
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase 클라이언트 생성 완료');

    // Prisma 스키마에 정의된 테이블들
    const prismaTables = [
      'users', 'profiles', 'projects', 'proposals', 'contracts',
      'messages', 'notifications', 'reviews', 'tech_stacks', 'file_uploads'
    ];

    console.log('📊 테이블 존재 여부 확인 중...\n');
    
    const existingTables = [];
    const missingTables = [];

    for (const tableName of prismaTables) {
      try {
        // 간단한 쿼리로 테이블 존재 여부 확인
        const { data, error } = await supabase
          .from(tableName)
          .select('count')
          .limit(1);
        
        if (error && error.code === 'PGRST116') {
          console.log(`❌ ${tableName}: 테이블이 존재하지 않음`);
          missingTables.push(tableName);
        } else if (error) {
          console.log(`⚠️  ${tableName}: 확인 불가 (${error.message})`);
          missingTables.push(tableName);
        } else {
          console.log(`✅ ${tableName}: 테이블 존재함`);
          existingTables.push(tableName);
        }
      } catch (err) {
        console.log(`❌ ${tableName}: 확인 실패 (${err.message})`);
        missingTables.push(tableName);
      }
    }

    console.log('\n📋 스키마 일치 여부 요약:');
    console.log(`   ✅ 존재하는 테이블: ${existingTables.length}개`);
    existingTables.forEach(table => console.log(`      - ${table}`));
    
    console.log(`   ❌ 누락된 테이블: ${missingTables.length}개`);
    missingTables.forEach(table => console.log(`      - ${table}`));

    const matchPercentage = Math.round((existingTables.length / prismaTables.length) * 100);
    console.log(`\n📊 일치율: ${matchPercentage}%`);

    if (matchPercentage === 100) {
      console.log('🎉 완벽하게 일치합니다!');
    } else if (matchPercentage >= 80) {
      console.log('✅ 거의 일치합니다. 몇 개 테이블만 추가하면 됩니다.');
    } else if (matchPercentage >= 50) {
      console.log('⚠️  부분적으로 일치합니다. 추가 작업이 필요합니다.');
    } else {
      console.log('❌ 많이 일치하지 않습니다. 스키마 동기화가 필요합니다.');
    }

    // 누락된 테이블이 있다면 생성 SQL 제공
    if (missingTables.length > 0) {
      console.log('\n💡 누락된 테이블 생성 방법:');
      console.log('   1. Supabase 대시보드 → SQL Editor');
      console.log('   2. SUPABASE_SCHEMA_SETUP.md 파일의 SQL 실행');
      console.log('   3. 또는 essential-tables.sql 파일 사용');
    }

  } catch (error) {
    console.error('❌ 스키마 확인 실패:', error.message);
  }
}

detailedSchemaCheck();
