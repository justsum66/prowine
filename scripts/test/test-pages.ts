/**
 * 頁面功能測試腳本
 * 檢查所有頁面是否可正常訪問
 */

import axios from 'axios'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

const pages = [
  '/',
  '/wines',
  '/wineries',
  '/blog',
  '/contact',
]

async function testPage(url: string) {
  try {
    const response = await axios.get(`${baseUrl}${url}`, {
      timeout: 10000,
      validateStatus: (status) => status < 500,
    })
    
    if (response.status === 200) {
      console.log(`✅ ${url} - OK`)
      return true
    } else {
      console.log(`⚠️  ${url} - Status: ${response.status}`)
      return false
    }
  } catch (error: any) {
    console.log(`❌ ${url} - Error: ${error.message}`)
    return false
  }
}

async function main() {
  console.log('🧪 開始測試頁面...\n')
  
  const results = await Promise.all(
    pages.map((page) => testPage(page))
  )
  
  const successCount = results.filter(Boolean).length
  const totalCount = pages.length
  
  console.log(`\n📊 測試結果: ${successCount}/${totalCount} 通過`)
  
  if (successCount === totalCount) {
    console.log('✅ 所有頁面測試通過！')
    process.exit(0)
  } else {
    console.log('⚠️  部分頁面測試失敗')
    process.exit(1)
  }
}

if (require.main === module) {
  main().catch(console.error)
}

