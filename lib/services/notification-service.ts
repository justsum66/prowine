// 動態導入 web-push（可選依賴）
// 使用完全動態的方式，避免 Turbopack 在構建時解析
let webpush: any = null;

// 使用 Function 構造函數動態導入，完全避免構建時解析
async function loadWebPush() {
  if (webpush !== null) {
    return webpush;
  }
  
  try {
    // 使用 Function 構造函數動態導入，這樣構建時完全不會解析
    // 這是唯一能讓 Turbopack 跳過模塊解析的方法
    const dynamicImport = new Function('moduleName', 'return import(moduleName)');
    const webPushModule = await dynamicImport('web-push');
    webpush = webPushModule.default || webPushModule;
    return webpush;
  } catch (error) {
    // web-push 未安裝，靜默失敗
    if (process.env.NODE_ENV === "development") {
      console.debug("web-push not available:", error);
    }
    return null;
  }
}

/**
 * 通知場景類型
 */
export type NotificationType =
  | "new_inquiry" // 新詢價單收到時
  | "order_status_change" // 訂單狀態變更時
  | "low_stock" // 庫存低於安全庫存時
  | "user_registration" // 用戶註冊時
  | "important_article" // 重要文章發布時
  | "system_maintenance"; // 系統維護通知

/**
 * 通知數據接口
 */
export interface NotificationData {
  type: NotificationType;
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
}

/**
 * 發送推送通知給所有訂閱用戶
 */
export async function sendPushNotificationToAll(
  notification: NotificationData
): Promise<{ success: number; failed: number }> {
  const { createServerSupabaseClient } = await import("@/lib/supabase/client");
  const supabase = createServerSupabaseClient();

  // 獲取所有推送訂閱
  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("*");

  if (error || !subscriptions || subscriptions.length === 0) {
    console.warn("沒有找到推送訂閱");
    return { success: 0, failed: 0 };
  }

  // 配置 web-push（需要 VAPID 密鑰）
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidEmail = process.env.VAPID_EMAIL || "admin@prowine.com.tw";

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.error("VAPID 密鑰未配置");
    return { success: 0, failed: subscriptions.length };
  }

  const webPushLib = await loadWebPush();
  if (!webPushLib) {
    console.warn("web-push is not available, skipping push notifications");
    return { success: 0, failed: subscriptions.length };
  }

  webPushLib.setVapidDetails(`mailto:${vapidEmail}`, vapidPublicKey, vapidPrivateKey);

  let success = 0;
  let failed = 0;

  // 發送給每個訂閱
  const promises = subscriptions.map(async (subscription) => {
    try {
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh_key,
          auth: subscription.auth_key,
        },
      };

      const payload = JSON.stringify({
        title: notification.title,
        body: notification.body,
        icon: notification.icon || "/fwdlogo/Logo-大.png",
        badge: notification.badge || "/fwdlogo/Logo-大.png",
        url: notification.url || "/",
        data: notification.data || {},
      });

      await webpush.sendNotification(pushSubscription, payload);
      success++;
    } catch (error: any) {
      console.error("發送推送通知失敗:", error);

      // 如果訂閱無效，從資料庫刪除
      if (error.statusCode === 410 || error.statusCode === 404) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("id", subscription.id);
      }

      failed++;
    }
  });

  await Promise.allSettled(promises);

  return { success, failed };
}

/**
 * 發送推送通知給特定用戶
 */
export async function sendPushNotificationToUser(
  userId: string,
  notification: NotificationData
): Promise<boolean> {
  // 使用 createServerSupabaseClient 從 client.ts（用於服務端）
  const { createServerSupabaseClient } = await import("@/lib/supabase/client");
  const supabase = createServerSupabaseClient();

  // 獲取用戶的推送訂閱
  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", userId);

  if (error || !subscriptions || subscriptions.length === 0) {
    console.warn(`用戶 ${userId} 沒有推送訂閱`);
    return false;
  }

  // 配置 web-push
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidEmail = process.env.VAPID_EMAIL || "admin@prowine.com.tw";

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.error("VAPID 密鑰未配置");
    return false;
  }

  const webPushLib = await loadWebPush();
  if (!webPushLib) {
    console.warn("web-push is not configured, skipping push notification");
    return false;
  }

  webPushLib.setVapidDetails(`mailto:${vapidEmail}`, vapidPublicKey, vapidPrivateKey);

  // 發送給用戶的所有訂閱（可能有多個設備）
  const promises = subscriptions.map(async (subscription) => {
    try {
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh_key,
          auth: subscription.auth_key,
        },
      };

      const payload = JSON.stringify({
        title: notification.title,
        body: notification.body,
        icon: notification.icon || "/fwdlogo/Logo-大.png",
        badge: notification.badge || "/fwdlogo/Logo-大.png",
        url: notification.url || "/",
        data: notification.data || {},
      });

      await webPushLib.sendNotification(pushSubscription, payload);
    } catch (error: any) {
      console.error("發送推送通知失敗:", error);

      // 如果訂閱無效，從資料庫刪除
      if (error.statusCode === 410 || error.statusCode === 404) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("id", subscription.id);
      }

      throw error;
    }
  });

  try {
    await Promise.all(promises);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 發送 Email 通知（使用 Resend）
 */
export async function sendEmailNotification(
  to: string | string[],
  subject: string,
  html: string,
  text?: string
): Promise<boolean> {
  try {
    // 使用 Resend 發送郵件
    const { sendEmail } = await import("@/lib/email");

    await sendEmail({
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      from: "ProWine <noreply@prowine.com.tw>",
    });

    return true;
  } catch (error: any) {
    console.error("發送 Email 通知失敗:", error);
    return false;
  }
}

/**
 * 發送通知（推送 + Email）
 */
export async function sendNotification(
  type: NotificationType,
  recipients: {
    userIds?: string[];
    emails?: string[];
    allUsers?: boolean;
  },
  notification: NotificationData
): Promise<{
  push: { success: number; failed: number };
  email: { success: number; failed: number };
}> {
  const results = {
    push: { success: 0, failed: 0 },
    email: { success: 0, failed: 0 },
  };

  // 發送推送通知
  if (recipients.allUsers) {
    const pushResult = await sendPushNotificationToAll(notification);
    results.push = pushResult;
  } else if (recipients.userIds && recipients.userIds.length > 0) {
    const pushPromises = recipients.userIds.map((userId) =>
      sendPushNotificationToUser(userId, notification)
    );
    const pushResults = await Promise.allSettled(pushPromises);
    results.push.success = pushResults.filter((r) => r.status === "fulfilled" && r.value).length;
    results.push.failed = pushResults.length - results.push.success;
  }

  // 發送 Email 通知
  if (recipients.emails && recipients.emails.length > 0) {
    const emailPromises = recipients.emails.map((email) =>
      sendEmailNotification(email, notification.title, notification.body)
    );
    const emailResults = await Promise.allSettled(emailPromises);
    results.email.success = emailResults.filter((r) => r.status === "fulfilled" && r.value).length;
    results.email.failed = emailResults.length - results.email.success;
  }

  return results;
}

