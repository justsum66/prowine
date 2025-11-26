#!/usr/bin/env tsx
/**
 * ProWine 關閉Node進程腳本
 */

import { execSync } from 'child_process'

const isWindows = process.platform === 'win32'

function main() {
  console.log('\n🔧 正在關閉所有Node進程...\n')
  
  try {
    if (isWindows) {
      try {
        execSync('taskkill /F /IM node.exe /T', { stdio: 'inherit' })
        console.log('\n✅ 已關閉所有Node進程\n')
      } catch (err: any) {
        if (err.status === 1) {
          console.log('\nℹ️  沒有運行中的Node進程\n')
        } else {
          throw err
        }
      }
    } else {
      try {
        execSync('pkill -f node', { stdio: 'inherit' })
        console.log('\n✅ 已關閉所有Node進程\n')
      } catch (err: any) {
        if (err.status === 1) {
          console.log('\nℹ️  沒有運行中的Node進程\n')
        } else {
          throw err
        }
      }
    }
  } catch (err) {
    console.error('\n❌ 關閉Node進程時發生錯誤:', err)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

