/**
 * Smoke Test - 基本功能檢查
 * 確保關鍵功能可以正常運行
 */

import { describe, test, expect } from 'vitest';

describe('Smoke Tests', () => {
  describe('API Endpoints', () => {
    test('Wines API should respond', async () => {
      const response = await fetch('http://localhost:3000/api/wines?limit=1');
      expect(response.status).toBeLessThan(500);
    });

    test('Wineries API should respond', async () => {
      const response = await fetch('http://localhost:3000/api/wineries?limit=1');
      expect(response.status).toBeLessThan(500);
    });

    test('Search API should respond', async () => {
      const response = await fetch('http://localhost:3000/api/search?q=wine');
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Pages', () => {
    test('Home page should load', async () => {
      const response = await fetch('http://localhost:3000/');
      expect(response.status).toBe(200);
    });

    test('Wines page should load', async () => {
      const response = await fetch('http://localhost:3000/wines');
      expect(response.status).toBe(200);
    });

    test('Wineries page should load', async () => {
      const response = await fetch('http://localhost:3000/wineries');
      expect(response.status).toBe(200);
    });
  });
});

