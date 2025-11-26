import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'

// 載入環境變數
config({ path: resolve(process.cwd(), '.env.local') })

async function executeSQL() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ 缺少 Supabase 環境變數')
    console.log('需要: NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY')
    return
  }

  console.log('🗄️  執行 SQL 建立資料表...')
  
  try {
    // 讀取SQL檔案
    const sqlPath = resolve(process.cwd(), 'scripts/database/schema.sql')
    const sql = readFileSync(sqlPath, 'utf-8')
    
    // 使用 Supabase Management API 執行 SQL
    // 注意：這需要 project_ref，從 URL 中提取
    const urlMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)
    if (!urlMatch) {
      console.error('❌ 無法從 Supabase URL 提取 project_ref')
      console.log('\n請手動在 Supabase SQL Editor 執行以下 SQL：\n')
      console.log(sql)
      return
    }
    
    const projectRef = urlMatch[1]
    const managementApiUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`
    
    console.log(`📡 連接到 Supabase 專案: ${projectRef}`)
    
    // 嘗試使用 Management API（需要 access token）
    // 但更簡單的方式是直接使用 SQL Editor
    console.log('\n⚠️  由於 Supabase API 限制，請手動執行 SQL')
    console.log('📝 步驟：')
    console.log('   1. 開啟: https://supabase.com/dashboard/project/' + projectRef + '/sql/new')
    console.log('   2. 複製以下 SQL 並執行：\n')
    console.log('─'.repeat(60))
    console.log(sql)
    console.log('─'.repeat(60))
    
    // 或者嘗試使用 Supabase CLI（如果已安裝）
    console.log('\n或者使用 Supabase CLI:')
    console.log(`   supabase link --project-ref ${projectRef}`)
    console.log('   supabase db push')
    
  } catch (error: any) {
    console.error('❌ 執行失敗:', error.message)
    console.log('\n請手動在 Supabase SQL Editor 執行 scripts/database/schema.sql')
  }
}

if (require.main === module) {
  executeSQL().catch(console.error)
}

export { executeSQL }

