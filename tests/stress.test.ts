/**
 * Stress Test - 壓力測試
 * 測試系統在高負載下的表現
 */

import { describe, test, expect } from 'vitest';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

describe('Stress Tests', () => {
  test('Concurrent API requests should handle load', async () => {
    const requests = Array.from({ length: 10 }, () =>
      fetch(`${BASE_URL}/api/wines?limit=5`)
    );

    const responses = await Promise.all(requests);
    
    // 至少 80% 的請求應該成功
    const successCount = responses.filter(r => r.ok).length;
    expect(successCount).toBeGreaterThanOrEqual(8);
  }, 30000);

  test('Parallel homepage data fetching', async () => {
    const startTime = Date.now();
    
    const [winesRes, wineriesRes] = await Promise.all([
      fetch(`${BASE_URL}/api/wines?featured=true&limit=3`),
      fetch(`${BASE_URL}/api/wineries?featured=true&limit=2`),
    ]);

    const duration = Date.now() - startTime;
    
    // 並行請求應該在 5 秒內完成
    expect(duration).toBeLessThan(5000);
    expect(winesRes.ok).toBe(true);
    expect(wineriesRes.ok).toBe(true);
  }, 10000);

  test('Rapid sequential requests should not fail', async () => {
    const requests = [];
    for (let i = 0; i < 5; i++) {
      requests.push(fetch(`${BASE_URL}/api/search?q=wine`));
      // 小延遲避免過於激進
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const responses = await Promise.all(requests);
    const successCount = responses.filter(r => r.ok).length;
    
    // 所有請求都應該成功
    expect(successCount).toBe(5);
  }, 15000);
});

