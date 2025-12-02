/**
 * API Test - 測試所有 API 端點
 */

import { describe, test, expect } from 'vitest';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

describe('API Tests', () => {
  describe('Wines API', () => {
    test('GET /api/wines should return wines', async () => {
      const response = await fetch(`${BASE_URL}/api/wines?limit=5`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty('wines');
      expect(Array.isArray(data.wines)).toBe(true);
    });

    test('GET /api/wines?featured=true should return featured wines', async () => {
      const response = await fetch(`${BASE_URL}/api/wines?featured=true&limit=3`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty('wines');
      if (data.wines.length > 0) {
        expect(data.wines[0].featured).toBe(true);
      }
    });

    test('GET /api/wines/[slug] should return wine details', async () => {
      // 先獲取一個 wine slug
      const listResponse = await fetch(`${BASE_URL}/api/wines?limit=1`);
      const listData = await listResponse.json();
      
      if (listData.wines && listData.wines.length > 0) {
        const slug = listData.wines[0].slug || listData.wines[0].id;
        const detailResponse = await fetch(`${BASE_URL}/api/wines/${slug}`);
        expect(detailResponse.ok).toBe(true);
        const detailData = await detailResponse.json();
        expect(detailData).toHaveProperty('wine');
      }
    });
  });

  describe('Wineries API', () => {
    test('GET /api/wineries should return wineries', async () => {
      const response = await fetch(`${BASE_URL}/api/wineries?limit=5`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty('wineries');
      expect(Array.isArray(data.wineries)).toBe(true);
    });

    test('GET /api/wineries?featured=true should return featured wineries', async () => {
      const response = await fetch(`${BASE_URL}/api/wineries?featured=true&limit=2`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty('wineries');
      if (data.wineries.length > 0) {
        expect(data.wineries[0].featured).toBe(true);
      }
    });
  });

  describe('Search API', () => {
    test('GET /api/search should return results', async () => {
      const response = await fetch(`${BASE_URL}/api/search?q=wine`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty('results');
      expect(Array.isArray(data.results)).toBe(true);
    });
  });

  describe('AI Chat API', () => {
    test('POST /api/ai/chat should handle request', async () => {
      const response = await fetch(`${BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: '測試訊息',
          conversationHistory: [],
        }),
      });
      
      // 無論成功或失敗，應該返回 JSON 格式
      expect(response.headers.get('content-type')).toContain('application/json');
      const data = await response.json();
      
      // 如果有錯誤，應該有明確的錯誤訊息
      if (!response.ok) {
        expect(data).toHaveProperty('error');
        expect(data).toHaveProperty('message');
      } else {
        expect(data).toHaveProperty('message');
      }
    });
  });
});

