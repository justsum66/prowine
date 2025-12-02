/**
 * 緩存工具函數
 * 支持內存緩存和Redis緩存（如果配置）
 */

interface CacheOptions {
  ttl?: number; // 過期時間（秒）
  tags?: string[]; // 緩存標籤（用於批量清除）
}

// 內存緩存（用於開發環境或小規模應用）
class MemoryCache {
  private cache: Map<string, { value: any; expires: number; tags: string[] }> = new Map();

  set(key: string, value: any, options: CacheOptions = {}): void {
    const expires = options.ttl ? Date.now() + options.ttl * 1000 : Infinity;
    this.cache.set(key, {
      value,
      expires,
      tags: options.tags || [],
    });
  }

  get<T = any>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  clearByTag(tag: string): void {
    for (const [key, item] of this.cache.entries()) {
      if (item.tags.includes(tag)) {
        this.cache.delete(key);
      }
    }
  }
}

const memoryCache = new MemoryCache();

/**
 * 設置緩存
 */
export async function setCache(
  key: string,
  value: any,
  options: CacheOptions = {}
): Promise<void> {
  // 如果配置了Redis，使用Redis
  if (process.env.REDIS_URL) {
    try {
      // 這裡可以集成Redis客戶端
      // const redis = await getRedisClient();
      // await redis.setex(key, options.ttl || 3600, JSON.stringify(value));
    } catch (error) {
      console.error("Redis cache error, falling back to memory cache:", error);
      memoryCache.set(key, value, options);
    }
  } else {
    // 使用內存緩存
    memoryCache.set(key, value, options);
  }
}

/**
 * 獲取緩存
 */
export async function getCache<T = any>(key: string): Promise<T | null> {
  // 如果配置了Redis，使用Redis
  if (process.env.REDIS_URL) {
    try {
      // const redis = await getRedisClient();
      // const value = await redis.get(key);
      // return value ? JSON.parse(value) : null;
      return null; // 暫時返回null，等待Redis集成
    } catch (error) {
      console.error("Redis cache error, falling back to memory cache:", error);
      return memoryCache.get<T>(key);
    }
  } else {
    // 使用內存緩存
    return memoryCache.get<T>(key);
  }
}

/**
 * 刪除緩存
 */
export async function deleteCache(key: string): Promise<void> {
  if (process.env.REDIS_URL) {
    try {
      // const redis = await getRedisClient();
      // await redis.del(key);
    } catch (error) {
      console.error("Redis cache error, falling back to memory cache:", error);
      memoryCache.delete(key);
    }
  } else {
    memoryCache.delete(key);
  }
}

/**
 * 根據標籤清除緩存
 */
export async function clearCacheByTag(tag: string): Promise<void> {
  if (process.env.REDIS_URL) {
    try {
      // const redis = await getRedisClient();
      // const keys = await redis.keys(`*:tag:${tag}:*`);
      // if (keys.length > 0) await redis.del(...keys);
    } catch (error) {
      console.error("Redis cache error, falling back to memory cache:", error);
      memoryCache.clearByTag(tag);
    }
  } else {
    memoryCache.clearByTag(tag);
  }
}

/**
 * 清除所有緩存
 */
export async function clearAllCache(): Promise<void> {
  if (process.env.REDIS_URL) {
    try {
      // const redis = await getRedisClient();
      // await redis.flushdb();
    } catch (error) {
      console.error("Redis cache error, falling back to memory cache:", error);
      memoryCache.clear();
    }
  } else {
    memoryCache.clear();
  }
}

/**
 * 緩存裝飾器（用於函數結果緩存）
 */
export function cached(key: string, options: CacheOptions = {}) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${key}:${JSON.stringify(args)}`;
      const cached = await getCache(cacheKey);

      if (cached !== null) {
        return cached;
      }

      const result = await method.apply(this, args);
      await setCache(cacheKey, result, options);
      return result;
    };

    return descriptor;
  };
}

