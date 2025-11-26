#!/usr/bin/env tsx
/**
 * ProWine 開發環境清理和重啟腳本
 * 
 * 功能：
 * 1. 關閉所有Node進程
 * 2. 清除.next目錄
 * 3. 清除node_modules/.cache
 * 4. 清除瀏覽器快取提示
 * 5. 重啟開發伺服器
 * 
 * 使用方式：
 * npm run dev:clean
 */

import { execSync } from 'child_process'
import { existsSync, rmSync } from 'fs'
import { join } from 'path'

const isWindows = process.platform === 'win32'

function log(message: string) {
  console.log(`\n🔧 ${message}`)
}

function error(message: string) {
  console.error(`\n❌ ${message}`)
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
      // Windows: 使用taskkill
      try {
        execSync('taskkill /F /IM node.exe /T', { stdio: 'ignore' })
        success('已關閉所有Node進程')
      } catch (err: any) {
        // 如果沒有Node進程在運行，會拋出錯誤，這是正常的
        if (err.status === 1) {
          log('沒有運行中的Node進程')
        } else {
          throw err
        }
      }
    } else {
      // Unix/Linux/Mac: 使用pkill
      try {
        execSync('pkill -f node', { stdio: 'ignore' })
        success('已關閉所有Node進程')
      } catch (err: any) {
        // 如果沒有Node進程在運行，會拋出錯誤，這是正常的
        if (err.status === 1) {
          log('沒有運行中的Node進程')
        } else {
          throw err
        }
      }
    }
    
    // 等待進程完全關閉
    await sleep(2000)
  } catch (err) {
    error(`關閉Node進程時發生錯誤: ${err}`)
    // 不中斷執行，繼續清理
  }
}

async function cleanNextDirectory() {
  log('正在清除.next目錄...')
  
  const nextDir = join(process.cwd(), '.next')
  
  if (existsSync(nextDir)) {
    try {
      rmSync(nextDir, { recursive: true, force: true })
      success('已清除.next目錄')
    } catch (err) {
      error(`清除.next目錄時發生錯誤: ${err}`)
      throw err
    }
  } else {
    log('.next目錄不存在，跳過')
  }
}

async function cleanCacheDirectory() {
  log('正在清除node_modules/.cache目錄...')
  
  const cacheDir = join(process.cwd(), 'node_modules', '.cache')
  
  if (existsSync(cacheDir)) {
    try {
      rmSync(cacheDir, { recursive: true, force: true })
      success('已清除node_modules/.cache目錄')
    } catch (err) {
      error(`清除快取目錄時發生錯誤: ${err}`)
      // 不中斷執行，快取清除失敗不影響開發
    }
  } else {
    log('node_modules/.cache目錄不存在，跳過')
  }
}

async function cleanBuildCache() {
  log('正在清除構建快取...')
  
  const buildCacheDirs = [
    join(process.cwd(), '.turbo'),
    join(process.cwd(), 'dist'),
    join(process.cwd(), 'out'),
  ]
  
  for (const dir of buildCacheDirs) {
    if (existsSync(dir)) {
      try {
        rmSync(dir, { recursive: true, force: true })
        log(`已清除 ${dir}`)
      } catch (err) {
        // 忽略錯誤，繼續清理其他目錄
      }
    }
  }
  
  success('已清除構建快取')
}

async function main() {
  console.log('\n╔════════════════════════════════════════╗')
  console.log('║   ProWine 開發環境清理和重啟工具      ║')
  console.log('╚════════════════════════════════════════╝\n')
  
  try {
    // 步驟1: 關閉所有Node進程
    await killNodeProcesses()
    
    // 步驟2: 清除.next目錄
    await cleanNextDirectory()
    
    // 步驟3: 清除node_modules/.cache
    await cleanCacheDirectory()
    
    // 步驟4: 清除其他構建快取
    await cleanBuildCache()
    
    console.log('\n╔════════════════════════════════════════╗')
    console.log('║   清理完成！準備啟動開發伺服器...      ║')
    console.log('╚════════════════════════════════════════╝\n')
    
    // 步驟5: 啟動開發伺服器
    log('正在啟動開發伺服器...')
    console.log('\n📝 提示：如果瀏覽器顯示舊版本，請按 Ctrl+Shift+R (Windows) 或 Cmd+Shift+R (Mac) 強制刷新\n')
    
    // 使用spawn而不是execSync，這樣可以讓開發伺服器持續運行
    const { spawn } = require('child_process')
    const devProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd(),
    })
    
    // 處理進程退出
    devProcess.on('exit', (code: number) => {
      if (code !== 0) {
        error(`開發伺服器異常退出，代碼: ${code}`)
        process.exit(code)
      }
    })
    
    // 處理錯誤
    devProcess.on('error', (err: Error) => {
      error(`啟動開發伺服器時發生錯誤: ${err.message}`)
      process.exit(1)
    })
    
  } catch (err) {
    error(`清理過程中發生錯誤: ${err}`)
    process.exit(1)
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  main().catch((err) => {
    error(`未處理的錯誤: ${err}`)
    process.exit(1)
  })
}

export { main as cleanAndRestart }

