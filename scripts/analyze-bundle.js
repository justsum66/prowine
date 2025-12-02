/**
 * Bundle 大小分析腳本
 * 用於分析 Next.js 應用程序的 bundle 大小
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📊 開始分析 Bundle 大小...\n');

try {
  // 執行 Next.js build
  console.log('🔨 執行 Next.js build...');
  execSync('npm run build', { stdio: 'inherit' });

  // 分析 .next 目錄結構
  const nextDir = path.join(process.cwd(), '.next');
  
  if (!fs.existsSync(nextDir)) {
    console.error('❌ .next 目錄不存在，請先執行 npm run build');
    process.exit(1);
  }

  console.log('\n📦 Bundle 大小分析結果：\n');
  
  // 分析 static 文件
  const staticDir = path.join(nextDir, 'static');
  if (fs.existsSync(staticDir)) {
    console.log('📁 Static 文件夾大小：');
    analyzeDirectory(staticDir);
  }

  // 分析 chunks
  const chunksDir = path.join(staticDir, 'chunks');
  if (fs.existsSync(chunksDir)) {
    console.log('\n📦 Chunks 大小分析：');
    analyzeChunks(chunksDir);
  }

  console.log('\n✅ Bundle 分析完成！\n');
  console.log('💡 提示：');
  console.log('  - 可以使用 @next/bundle-analyzer 進行更詳細的分析');
  console.log('  - 查看 .next/analyze/ 目錄獲取詳細報告');

} catch (error) {
  console.error('❌ Bundle 分析失敗：', error.message);
  process.exit(1);
}

function analyzeDirectory(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  let totalSize = 0;

  files.forEach(file => {
    const filePath = path.join(dir, file.name);
    if (file.isDirectory()) {
      const size = getDirectorySize(filePath);
      totalSize += size;
      console.log(`  📁 ${file.name}: ${formatBytes(size)}`);
    } else {
      const stats = fs.statSync(filePath);
      totalSize += stats.size;
      if (stats.size > 100 * 1024) { // 只顯示大於 100KB 的文件
        console.log(`  📄 ${file.name}: ${formatBytes(stats.size)}`);
      }
    }
  });

  console.log(`  📊 總計: ${formatBytes(totalSize)}`);
}

function analyzeChunks(chunksDir) {
  const files = fs.readdirSync(chunksDir);
  const chunks = [];

  files.forEach(file => {
    if (file.endsWith('.js')) {
      const filePath = path.join(chunksDir, file);
      const stats = fs.statSync(filePath);
      chunks.push({
        name: file,
        size: stats.size,
      });
    }
  });

  // 按大小排序
  chunks.sort((a, b) => b.size - a.size);

  // 顯示前 10 個最大的 chunks
  console.log('  前 10 個最大的 Chunks:');
  chunks.slice(0, 10).forEach((chunk, index) => {
    console.log(`  ${index + 1}. ${chunk.name}: ${formatBytes(chunk.size)}`);
  });
}

function getDirectorySize(dir) {
  let size = 0;
  const files = fs.readdirSync(dir, { withFileTypes: true });

  files.forEach(file => {
    const filePath = path.join(dir, file.name);
    if (file.isDirectory()) {
      size += getDirectorySize(filePath);
    } else {
      const stats = fs.statSync(filePath);
      size += stats.size;
    }
  });

  return size;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

