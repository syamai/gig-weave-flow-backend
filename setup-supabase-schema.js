#!/usr/bin/env node

// Supabase 스키마 생성 스크립트
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function setupSupabaseSchema() {
  console.log('🚀 Supabase 스키마 설정 시작...\n');

  // 환경 변수 확인
  const supabaseUrl = process.env.SUPABASE_URL || 'https://xmeuypaqqtqcvkryygjo.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase URL 또는 Key가 설정되지 않았습니다.');
    process.exit(1);
  }

  try {
    // Supabase 클라이언트 생성
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase 클라이언트 생성 완료');

    // 스키마 파일 읽기
    const schemaPath = path.join(__dirname, 'src/database/schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📄 스키마 파일 읽기 완료');
    console.log('📊 스키마 크기:', schemaSQL.length, '문자');

    // SQL을 문장별로 분리
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`\n🔧 ${statements.length}개의 SQL 문장을 실행합니다...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        console.log(`[${i + 1}/${statements.length}] 실행 중...`);
        
        // Supabase에서 직접 SQL 실행 (RPC 사용)
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement
        });

        if (error) {
          // 일부 에러는 무시 (테이블이 이미 존재하는 경우 등)
          if (error.message.includes('already exists') || 
              error.message.includes('does not exist') ||
              error.message.includes('duplicate key')) {
            console.log(`   ⚠️  경고: ${error.message}`);
          } else {
            throw error;
          }
        } else {
          console.log(`   ✅ 성공`);
          successCount++;
        }
      } catch (error) {
        console.log(`   ❌ 실패: ${error.message}`);
        errorCount++;
      }
    }

    console.log(`\n📊 실행 결과:`);
    console.log(`   ✅ 성공: ${successCount}개`);
    console.log(`   ❌ 실패: ${errorCount}개`);

    // 테이블 목록 확인
    console.log('\n🔍 생성된 테이블 확인 중...');
    
    try {
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_type', ['BASE TABLE']);

      if (tablesError) {
        console.log('⚠️  테이블 목록을 가져올 수 없습니다.');
      } else {
        console.log('✅ 생성된 테이블:');
        tables.forEach(table => {
          console.log(`   - ${table.table_name}`);
        });
      }
    } catch (error) {
      console.log('⚠️  테이블 목록 확인 중 오류:', error.message);
    }

    console.log('\n🎉 Supabase 스키마 설정 완료!');
    console.log('💡 이제 API 서버를 시작할 수 있습니다.');

  } catch (error) {
    console.error('\n❌ 스키마 설정 실패:');
    console.error('   에러:', error.message);
    
    console.log('\n💡 해결 방법:');
    console.log('   1. Supabase 대시보드에서 SQL Editor를 사용하여 수동으로 스키마 생성');
    console.log('   2. 또는 Supabase CLI를 사용하여 마이그레이션 실행');
    
    process.exit(1);
  }
}

// 스크립트 실행
setupSupabaseSchema();
