#!/usr/bin/env node

// Supabase 데이터베이스 스키마와 Prisma 스키마 일치 여부 확인
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkSchemaConsistency() {
  console.log('🔍 Supabase 데이터베이스와 Prisma 스키마 일치 여부 확인...\n');

  const supabaseUrl = process.env.SUPABASE_URL || 'https://xmeuypaqqtqcvkryygjo.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.');
    process.exit(1);
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase 클라이언트 생성 완료');

    // 현재 데이터베이스의 테이블 목록 조회
    console.log('📊 데이터베이스 테이블 목록 조회 중...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_type', ['BASE TABLE']);

    if (tablesError) {
      console.log('⚠️  시스템 테이블 조회 실패, 다른 방법으로 시도 중...');
      
      // 다른 방법으로 테이블 확인
      const expectedTables = [
        'users', 'profiles', 'projects', 'proposals', 'contracts',
        'messages', 'notifications', 'reviews', 'tech_stacks', 'file_uploads'
      ];
      
      console.log('🔍 예상 테이블 존재 여부 확인 중...');
      
      for (const tableName of expectedTables) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('count')
            .limit(1);
          
          if (error && error.code === 'PGRST116') {
            console.log(`❌ ${tableName}: 테이블이 존재하지 않음`);
          } else if (error) {
            console.log(`⚠️  ${tableName}: 확인 불가 (${error.message})`);
          } else {
            console.log(`✅ ${tableName}: 테이블 존재함`);
          }
        } catch (err) {
          console.log(`❌ ${tableName}: 확인 실패 (${err.message})`);
        }
      }
    } else {
      console.log('✅ 데이터베이스 테이블 목록:');
      tables.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
    }

    // Prisma 스키마와 비교
    console.log('\n📋 Prisma 스키마에 정의된 테이블:');
    const prismaTables = [
      'users', 'profiles', 'projects', 'proposals', 'contracts',
      'messages', 'notifications', 'reviews', 'tech_stacks', 'file_uploads'
    ];
    
    prismaTables.forEach(table => {
      console.log(`   - ${table}`);
    });

    console.log('\n🔍 스키마 일치 여부 분석:');
    console.log('   - Prisma 스키마: 10개 테이블 정의됨');
    console.log('   - Supabase 데이터베이스: 위에서 확인된 테이블들');
    
    console.log('\n💡 권장사항:');
    console.log('   1. Supabase 대시보드에서 SQL Editor 사용');
    console.log('   2. SUPABASE_SCHEMA_SETUP.md의 SQL 실행');
    console.log('   3. 또는 Prisma 마이그레이션 사용');

  } catch (error) {
    console.error('❌ 스키마 확인 실패:', error.message);
  }
}

checkSchemaConsistency();
