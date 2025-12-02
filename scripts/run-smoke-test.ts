/**
 * Smoke Test - 快速功能檢查
 * 不依賴測試框架，直接運行
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

interface TestResult {
  name: string;
  status: 'pass' | 'fail';
  message: string;
}

const results: TestResult[] = [];

async function testEndpoint(name: string, url: string) {
  try {
    const response = await fetch(url, { 
      signal: AbortSignal.timeout(5000) 
    });
    
    if (response.status < 500) {
      results.push({
        name,
        status: 'pass',
        message: `HTTP ${response.status}`,
      });
      return true;
    } else {
      results.push({
        name,
        status: 'fail',
        message: `HTTP ${response.status}`,
      });
      return false;
    }
  } catch (error: any) {
    results.push({
      name,
      status: 'fail',
      message: error.message || '連接失敗',
    });
    return false;
  }
}

async function main() {
  console.log('🔥 運行 Smoke Test...\n');
  console.log(`📍 Base URL: ${BASE_URL}\n`);

  // 檢查服務器是否運行
  console.log('1️⃣  檢查服務器連接...');
  const serverRunning = await testEndpoint('服務器連接', `${BASE_URL}/`);

  if (!serverRunning) {
    console.log('\n⚠️  服務器未運行，跳過其他測試');
    console.log('💡 請先運行: npm run dev');
    process.exit(1);
  }

  // API 測試
  console.log('\n2️⃣  測試 API 端點...');
  await testEndpoint('Wines API', `${BASE_URL}/api/wines?limit=1`);
  await testEndpoint('Wineries API', `${BASE_URL}/api/wineries?limit=1`);
  await testEndpoint('Search API', `${BASE_URL}/api/search?q=wine`);

  // 頁面測試
  console.log('\n3️⃣  測試頁面...');
  await testEndpoint('首頁', `${BASE_URL}/`);
  await testEndpoint('酒款頁', `${BASE_URL}/wines`);
  await testEndpoint('酒莊頁', `${BASE_URL}/wineries`);

  // 顯示結果
  console.log('\n' + '='.repeat(60));
  console.log('📊 Smoke Test 結果');
  console.log('='.repeat(60) + '\n');

  const pass = results.filter(r => r.status === 'pass').length;
  const fail = results.filter(r => r.status === 'fail').length;

  results.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : '❌';
    console.log(`${icon} ${result.name}: ${result.message}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log(`✅ 通過: ${pass} | ❌ 失敗: ${fail}`);
  console.log('='.repeat(60) + '\n');

  if (fail > 0) {
    console.log('⚠️  部分測試失敗，請檢查服務器狀態');
    process.exit(1);
  } else {
    console.log('✅ 所有 Smoke Test 通過！');
  }
}

main().catch(console.error);

