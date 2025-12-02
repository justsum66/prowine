"use client";

/**
 * 後台同步工具函數
 */

/**
 * 註冊後台同步任務
 */
export async function registerBackgroundSync(tag: string, data?: any): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("sync" in (self as any).ServiceWorkerRegistration.prototype)) {
    console.warn("此瀏覽器不支持後台同步");
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // 如果需要，先保存數據到 IndexedDB
    if (data) {
      await saveDataForSync(tag, data);
    }

    // 註冊同步任務
    await (registration as any).sync.register(tag);
    console.log(`[Background Sync] 已註冊同步任務: ${tag}`);
    return true;
  } catch (error) {
    console.error(`[Background Sync] 註冊失敗: ${tag}`, error);
    return false;
  }
}

/**
 * 保存數據到 IndexedDB 供後台同步使用
 */
async function saveDataForSync(key: string, data: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("prowine-sync", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(["sync-data"], "readwrite");
      const store = transaction.objectStore("sync-data");
      const putRequest = store.put({ value: data, timestamp: Date.now() }, key);

      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("sync-data")) {
        db.createObjectStore("sync-data");
      }
    };
  });
}

/**
 * 同步購物車（離線時自動在線時同步）
 */
export async function syncCartOffline(cartItems: any[]): Promise<boolean> {
  return registerBackgroundSync("sync-cart", cartItems);
}

/**
 * 同步願望清單（離線時自動在線時同步）
 */
export async function syncWishlistOffline(wishlistItems: any[]): Promise<boolean> {
  return registerBackgroundSync("sync-wishlist", wishlistItems);
}

/**
 * 同步詢價單（離線時自動在線時同步）
 */
export async function syncInquiryOffline(inquiryData: any): Promise<boolean> {
  return registerBackgroundSync("sync-inquiry", inquiryData);
}

