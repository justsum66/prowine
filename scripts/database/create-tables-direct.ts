import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'
import { Client } from 'pg'

// 載入環境變數
config({ path: resolve(process.cwd(), '.env.local') })

async function createTablesDirect() {
  console.log('🗄️  直接建立 Supabase 資料表...')
  
  try {
    // 讀取SQL檔案
    const sqlPath = resolve(process.cwd(), 'scripts/database/schema.sql')
    const sql = readFileSync(sqlPath, 'utf-8')
    
    // 嘗試從環境變數獲取資料庫連接
    const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL
    
    if (!dbUrl) {
      // 從Supabase URL構建連接字串（需要密碼）
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
      const supabasePassword = process.env.SUPABASE_DB_PASSWORD
      
      if (!supabaseUrl || !supabasePassword) {
        console.error('❌ 缺少資料庫連接資訊')
        console.log('\n需要以下環境變數之一：')
        console.log('  - DATABASE_URL (完整PostgreSQL連接字串)')
        console.log('  - SUPABASE_DB_URL (完整PostgreSQL連接字串)')
        console.log('  或')
        console.log('  - NEXT_PUBLIC_SUPABASE_URL + SUPABASE_DB_PASSWORD')
        console.log('\n📝 或者手動在 Supabase Dashboard 執行 SQL：')
        console.log(`   開啟: https://supabase.com/dashboard/project/${supabaseUrl?.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1]}/sql/new`)
        console.log('\nSQL內容：\n')
        console.log(sql)
        return
      }
      
      // 從URL提取project ref和region
      const urlMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)
      if (!urlMatch) {
        console.error('❌ 無法解析 Supabase URL')
        return
      }
      
      const projectRef = urlMatch[1]
      // 預設region為aws-ap-northeast-1，但可能需要從環境變數獲取
      const region = process.env.SUPABASE_REGION || 'aws-ap-northeast-1'
      
      // 構建連接字串
      const dbUrl = `postgresql://postgres.${projectRef}:${supabasePassword}@aws-0-${region}.pooler.supabase.com:6543/postgres`
      
      await executeSQL(dbUrl, sql)
    } else {
      await executeSQL(dbUrl, sql)
    }
    
  } catch (error: any) {
    console.error('❌ 執行失敗:', error.message)
    console.log('\n請手動在 Supabase SQL Editor 執行 scripts/database/schema.sql')
  }
}

async function executeSQL(connectionString: string, sql: string) {
  const client = new Client({ connectionString })
  
  try {
    console.log('📡 連接到資料庫...')
    await client.connect()
    console.log('✅ 連接成功')
    
    // 分割SQL語句並執行
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    console.log(`📋 執行 ${statements.length} 個SQL語句...`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.length < 10) continue // 跳過太短的語句
      
      try {
        await client.query(statement)
        console.log(`✅ 語句 ${i + 1}/${statements.length} 執行成功`)
      } catch (error: any) {
        // 忽略已存在的錯誤
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log(`⚠️  語句 ${i + 1}/${statements.length} 已存在，跳過`)
        } else {
          console.error(`❌ 語句 ${i + 1}/${statements.length} 執行失敗:`, error.message)
        }
      }
    }
    
    console.log('\n✅ 資料表建立完成！')
    
  } catch (error: any) {
    console.error('❌ 資料庫連接失敗:', error.message)
    throw error
  } finally {
    await client.end()
  }
}

if (require.main === module) {
  createTablesDirect().catch(console.error)
}

export { createTablesDirect }
