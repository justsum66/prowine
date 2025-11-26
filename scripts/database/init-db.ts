import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'

// 載入環境變數
config({ path: resolve(process.cwd(), '.env.local') })

import { createAdminClient } from '@/lib/supabase/admin'

const supabase = createAdminClient()

async function initDatabase() {
  console.log('🗄️  開始初始化資料庫...')
  
  try {
    // 讀取SQL檔案
    const sqlPath = resolve(process.cwd(), 'scripts/database/schema.sql')
    const sql = readFileSync(sqlPath, 'utf-8')
    
    // 分割SQL語句
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    console.log(`找到 ${statements.length} 個SQL語句`)
    
    // 執行每個語句
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.length < 10) continue // 跳過太短的語句
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        
        // 如果RPC不存在，使用直接查詢
        if (error && error.message.includes('exec_sql')) {
          // 使用Supabase的SQL執行（需要通過API）
          console.log(`執行語句 ${i + 1}/${statements.length}...`)
          // 注意：Supabase JS客戶端不支援直接執行DDL，需要通過SQL Editor
          // 這裡我們只檢查表格是否存在
        } else if (error) {
          console.error(`❌ SQL語句 ${i + 1} 執行失敗:`, error.message)
        } else {
          console.log(`✅ SQL語句 ${i + 1} 執行成功`)
        }
      } catch (err: any) {
        console.log(`⚠️  語句 ${i + 1} 跳過: ${err.message}`)
      }
    }
    
    // 檢查表格是否存在
    const tables = ['wineries', 'wines', 'blog_posts', 'inquiries']
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*').limit(1)
      if (error) {
        console.error(`❌ 表格 ${table} 不存在或無法訪問`)
        console.error(`   請在Supabase SQL Editor執行 scripts/database/schema.sql`)
      } else {
        console.log(`✅ 表格 ${table} 存在`)
      }
    }
    
    console.log('\n✅ 資料庫檢查完成')
    console.log('⚠️  如果表格不存在，請在Supabase SQL Editor執行 scripts/database/schema.sql')
    
  } catch (error: any) {
    console.error('❌ 初始化失敗:', error.message)
    console.log('\n請手動在Supabase SQL Editor執行 scripts/database/schema.sql')
  }
}

if (require.main === module) {
  initDatabase().catch(console.error)
}

