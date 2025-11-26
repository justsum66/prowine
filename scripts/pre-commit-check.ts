#!/usr/bin/env tsx
/**
 * 提交前檢查腳本
 * 確保不會提交會導致頁面崩潰的代碼
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'

console.log('\n╔════════════════════════════════════════╗')
console.log('║   提交前檢查 - 防止破壞性錯誤        ║')
console.log('╚════════════════════════════════════════╝\n')

let hasError = false

// 1. 類型檢查
console.log('🔍 步驟 1/4: 執行 TypeScript 類型檢查...')
try {
  execSync('npm run build', { stdio: 'inherit' })
  console.log('✅ 類型檢查通過\n')
} catch (error) {
  console.error('❌ 類型檢查失敗！請修復錯誤後再提交。\n')
  hasError = true
}

// 2. 檢查關鍵文件是否存在
console.log('🔍 步驟 2/4: 檢查關鍵文件...')
const criticalFiles = [
  'app/layout.tsx',
  'app/(main)/layout.tsx',
  'app/(main)/page.tsx',
  'components/ErrorBoundary.tsx',
]

for (const file of criticalFiles) {
  if (!existsSync(file)) {
    console.error(`❌ 關鍵文件缺失: ${file}`)
    hasError = true
  }
}
if (!hasError) {
  console.log('✅ 所有關鍵文件存在\n')
}

// 3. 檢查是否有明顯的導入錯誤
console.log('🔍 步驟 3/4: 檢查導入錯誤...')
try {
  const result = execSync('npx tsc --noEmit --skipLibCheck', { encoding: 'utf-8' })
  if (result.includes('error')) {
    console.error('❌ 發現導入錯誤！')
    console.error(result)
    hasError = true
  } else {
    console.log('✅ 導入檢查通過\n')
  }
} catch (error: any) {
  console.error('❌ 導入檢查失敗！')
  console.error(error.stdout || error.message)
  hasError = true
}

// 4. 最終檢查
if (hasError) {
  console.log('\n❌ 檢查失敗！請修復所有錯誤後再提交。')
  process.exit(1)
} else {
  console.log('✅ 所有檢查通過！可以安全提交。\n')
  process.exit(0)
}

