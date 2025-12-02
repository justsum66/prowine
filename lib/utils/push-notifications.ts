"use client";

/**
 * 推送通知工具函數
 */

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * 請求推送通知權限
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    console.warn("此瀏覽器不支持推送通知");
    return "denied";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission === "denied") {
    return "denied";
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * 訂閱推送通知
 */
export async function subscribeToPushNotifications(): Promise<PushSubscriptionData | null> {
  try {
    // 檢查 Service Worker 支持
    if (!("serviceWorker" in navigator)) {
      console.warn("此瀏覽器不支持 Service Worker");
      return null;
    }

    // 檢查推送通知支持
    if (!("PushManager" in window)) {
      console.warn("此瀏覽器不支持推送通知");
      return null;
    }

    // 請求權限
    const permission = await requestNotificationPermission();
    if (permission !== "granted") {
      console.warn("用戶拒絕了推送通知權限");
      return null;
    }

    // 獲取 Service Worker 註冊
    const registration = await navigator.serviceWorker.ready;

    // 檢查是否已訂閱
    let subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      console.log("已存在推送訂閱");
      return subscriptionToData(subscription);
    }

    // 創建新的訂閱
    // 注意：這裡需要 VAPID 公鑰，應該從環境變數或 API 獲取
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.error("VAPID 公鑰未配置");
      return null;
    }

    const keyArray = urlBase64ToUint8Array(vapidPublicKey);
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: keyArray.buffer as ArrayBuffer,
    });

    // 將訂閱發送到服務器
    const subscriptionData = subscriptionToData(subscription);
    await sendSubscriptionToServer(subscriptionData);

    return subscriptionData;
  } catch (error) {
    console.error("訂閱推送通知失敗:", error);
    return null;
  }
}

/**
 * 取消推送通知訂閱
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      await removeSubscriptionFromServer(subscriptionToData(subscription));
      return true;
    }

    return false;
  } catch (error) {
    console.error("取消訂閱失敗:", error);
    return false;
  }
}

/**
 * 檢查是否已訂閱推送通知
 */
export async function isSubscribedToPushNotifications(): Promise<boolean> {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch (error) {
    console.error("檢查訂閱狀態失敗:", error);
    return false;
  }
}

/**
 * 顯示本地通知（不需要推送服務器）
 */
export async function showLocalNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  const permission = await requestNotificationPermission();
  if (permission !== "granted") {
    return;
  }

  const notificationOptions: NotificationOptions = {
    icon: "/fwdlogo/Logo-大.png",
    badge: "/fwdlogo/Logo-大.png",
    ...options,
  };

  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, notificationOptions);
  } else {
    new Notification(title, notificationOptions);
  }
}

/**
 * 將 PushSubscription 轉換為可序列化的數據
 */
function subscriptionToData(subscription: PushSubscription): PushSubscriptionData {
  const key = subscription.getKey("p256dh");
  const auth = subscription.getKey("auth");

  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: key ? btoa(String.fromCharCode(...Array.from(new Uint8Array(key)))) : "",
      auth: auth ? btoa(String.fromCharCode(...Array.from(new Uint8Array(auth)))) : "",
    },
  };
}

/**
 * 將 VAPID 公鑰從 base64 URL 格式轉換為 Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * 將訂閱發送到服務器
 */
async function sendSubscriptionToServer(subscription: PushSubscriptionData): Promise<void> {
  try {
    const response = await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(subscription),
    });

    if (!response.ok) {
      throw new Error("發送訂閱到服務器失敗");
    }
  } catch (error) {
    console.error("發送訂閱到服務器失敗:", error);
    throw error;
  }
}

/**
 * 從服務器移除訂閱
 */
async function removeSubscriptionFromServer(subscription: PushSubscriptionData): Promise<void> {
  try {
    const response = await fetch("/api/notifications/unsubscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(subscription),
    });

    if (!response.ok) {
      throw new Error("從服務器移除訂閱失敗");
    }
  } catch (error) {
    console.error("從服務器移除訂閱失敗:", error);
  }
}

