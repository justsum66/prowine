#!/usr/bin/env tsx
/**
 * ProWine 清理腳本
 * 僅執行清理，不重啟伺服器
 */

import { execSync } from 'child_process'
import { existsSync, rmSync } from 'fs'
import { join } from 'path'

const isWindows = process.platform === 'win32'

function log(message: string) {
  console.log(`\n🔧 ${message}`)
}

function success(message: string) {
  console.log(`\n✅ ${message}`)
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function killNodeProcesses() {
  log('正在關閉所有Node進程...')
  
  try {
    if (isWindows) {
      try {
        execSync('taskkill /F /IM node.exe /T', { stdio: 'ignore' })
        success('已關閉所有Node進程')
      } catch (err: any) {
        if (err.status === 1) {
          log('沒有運行中的Node進程')
        }
      }
    } else {
      try {
        execSync('pkill -f node', { stdio: 'ignore' })
        success('已關閉所有Node進程')
      } catch (err: any) {
        if (err.status === 1) {
          log('沒有運行中的Node進程')
        }
      }
    }
    await sleep(2000)
  } catch (err) {
    // 忽略錯誤
  }
}

async function cleanDirectories() {
  const dirs = [
    join(process.cwd(), '.next'),
    join(process.cwd(), 'node_modules', '.cache'),
    join(process.cwd(), '.turbo'),
    join(process.cwd(), 'dist'),
    join(process.cwd(), 'out'),
  ]
  
  for (const dir of dirs) {
    if (existsSync(dir)) {
      try {
        rmSync(dir, { recursive: true, force: true })
        log(`已清除 ${dir}`)
      } catch (err) {
        // 忽略錯誤
      }
    }
  }
  
  success('清理完成')
}

async function main() {
  console.log('\n╔════════════════════════════════════════╗')
  console.log('║   ProWine 清理工具                    ║')
  console.log('╚════════════════════════════════════════╝\n')
  
  await killNodeProcesses()
  await cleanDirectories()
  
  console.log('\n✅ 所有清理操作完成！\n')
}

if (require.main === module) {
  main().catch(console.error)
}

export { main as clean }

