/**
 * 速率限制工具測試
 */

import { describe, test, expect, beforeEach } from "vitest";
import { rateLimiter, rateLimitConfigs } from "@/lib/utils/rate-limiter";

describe("RateLimiter", () => {
  beforeEach(() => {
    rateLimiter.clear();
  });

  test("應該允許在限制內的請求", () => {
    const config = rateLimitConfigs.api;
    const key = "test-key";

    for (let i = 0; i < config.max; i++) {
      const result = rateLimiter.check(key, config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(config.max - i - 1);
    }
  });

  test("應該拒絕超過限制的請求", () => {
    const config = rateLimitConfigs.api;
    const key = "test-key";

    // 發送最大請求數
    for (let i = 0; i < config.max; i++) {
      rateLimiter.check(key, config);
    }

    // 下一次請求應該被拒絕
    const result = rateLimiter.check(key, config);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  test("應該在時間窗口後重置限制", async () => {
    const config = {
      windowMs: 100, // 100ms
      max: 2,
    };
    const key = "test-key";

    // 發送最大請求數
    rateLimiter.check(key, config);
    rateLimiter.check(key, config);

    // 應該被拒絕
    expect(rateLimiter.check(key, config).allowed).toBe(false);

    // 等待時間窗口過期
    await new Promise((resolve) => setTimeout(resolve, 150));

    // 應該允許新請求
    expect(rateLimiter.check(key, config).allowed).toBe(true);
  });

  test("應該正確重置特定 key", () => {
    const config = rateLimitConfigs.api;
    const key1 = "key1";
    const key2 = "key2";

    // 兩個 key 都達到限制
    for (let i = 0; i < config.max; i++) {
      rateLimiter.check(key1, config);
      rateLimiter.check(key2, config);
    }

    // 重置 key1
    rateLimiter.reset(key1);

    // key1 應該允許請求
    expect(rateLimiter.check(key1, config).allowed).toBe(true);
    // key2 應該仍然被限制
    expect(rateLimiter.check(key2, config).allowed).toBe(false);
  });
});

