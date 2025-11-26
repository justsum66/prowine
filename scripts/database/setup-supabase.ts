import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'
import { createAdminClient } from '@/lib/supabase/admin'

// 載入環境變數
config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createAdminClient()

async function setupSupabase() {
  console.log('🗄️  開始設定 Supabase 資料庫...')
  
  try {
    // 讀取SQL檔案
    const sqlPath = resolve(process.cwd(), 'scripts/database/schema.sql')
    const sql = readFileSync(sqlPath, 'utf-8')
    
    // 分割SQL語句（以分號分割，但保留CREATE POLICY等完整語句）
    const statements = sql
      .split(/;(?=\s*(?:CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|GRANT|REVOKE|COMMENT|--))/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.match(/^\s*$/))
    
    console.log(`📋 找到 ${statements.length} 個SQL語句`)
    
    // 由於Supabase JS客戶端不支援直接執行DDL，我們需要通過REST API
    // 但更簡單的方式是使用Supabase的SQL Editor
    // 這裡我們檢查表格是否存在，如果不存在則提示
    
    const tables = ['wineries', 'wines', 'blog_posts', 'inquiries', 'ai_chat_history']
    let allTablesExist = true
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        console.error(`❌ 表格 ${table} 不存在:`, error.message)
        allTablesExist = false
      } else {
        console.log(`✅ 表格 ${table} 已存在`)
      }
    }
    
    if (!allTablesExist) {
      console.log('\n⚠️  部分表格不存在，需要執行SQL建立資料表')
      console.log('📝 請執行以下步驟：')
      console.log('   1. 登入 Supabase Dashboard')
      console.log('   2. 進入 SQL Editor')
      console.log('   3. 複製以下SQL內容並執行：\n')
      console.log('─'.repeat(60))
      console.log(sql)
      console.log('─'.repeat(60))
      console.log('\n或者使用 Supabase CLI:')
      console.log('   supabase db reset')
      console.log('   supabase db push')
      
      // 嘗試通過REST API執行（需要service role key）
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      
      if (supabaseUrl && serviceRoleKey) {
        console.log('\n🔄 嘗試通過REST API執行SQL...')
        try {
          // Supabase REST API執行SQL的方式
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': serviceRoleKey,
              'Authorization': `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({ sql_query: sql }),
          })
          
          if (response.ok) {
            console.log('✅ SQL執行成功')
            allTablesExist = true
          } else {
            console.log('⚠️  REST API執行失敗，請手動執行SQL')
          }
        } catch (error) {
          console.log('⚠️  無法通過REST API執行，請手動執行SQL')
        }
      }
    } else {
      console.log('\n✅ 所有資料表已存在，資料庫設定完成！')
    }
    
    return allTablesExist
  } catch (error: any) {
    console.error('❌ 設定失敗:', error.message)
    console.log('\n請手動在Supabase SQL Editor執行 scripts/database/schema.sql')
    return false
  }
}

if (require.main === module) {
  setupSupabase().catch(console.error)
}

export { setupSupabase }

