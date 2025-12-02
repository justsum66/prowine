/**
 * 通知系統工具函數
 */

export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

/**
 * 發送實時通知（使用WebSocket或Server-Sent Events）
 */
export class NotificationService {
  private eventSource: EventSource | null = null;
  private callbacks: Map<string, (notification: Notification) => void> = new Map();

  constructor(private adminId: string) {}

  /**
   * 連接通知服務
   */
  connect(onNotification: (notification: Notification) => void) {
    // 使用Server-Sent Events實現實時通知
    this.eventSource = new EventSource(`/api/admin/notifications/stream?adminId=${this.adminId}`);

    this.eventSource.onmessage = (event) => {
      try {
        const notification: Notification = JSON.parse(event.data);
        onNotification(notification);
        this.callbacks.forEach((callback) => callback(notification));
      } catch (error) {
        console.error("Failed to parse notification:", error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error("Notification stream error:", error);
      // 可以實現重連邏輯
    };
  }

  /**
   * 斷開連接
   */
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  /**
   * 標記通知為已讀
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/admin/notifications/${notificationId}/read`, {
        method: "PUT",
      });
      return response.ok;
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      return false;
    }
  }

  /**
   * 獲取未讀通知數量
   */
  async getUnreadCount(): Promise<number> {
    try {
      const response = await fetch("/api/admin/notifications/unread-count");
      if (response.ok) {
        const data = await response.json();
        return data.count || 0;
      }
      return 0;
    } catch (error) {
      console.error("Failed to get unread count:", error);
      return 0;
    }
  }

  /**
   * 獲取所有通知
   */
  async getAllNotifications(limit: number = 50): Promise<Notification[]> {
    try {
      const response = await fetch(`/api/admin/notifications?limit=${limit}`);
      if (response.ok) {
        const data = await response.json();
        return data.notifications || [];
      }
      return [];
    } catch (error) {
      console.error("Failed to get notifications:", error);
      return [];
    }
  }
}

/**
 * 創建通知（服務器端使用）
 */
export async function createNotification(
  adminId: string,
  type: Notification["type"],
  title: string,
  message: string,
  link?: string
): Promise<boolean> {
  try {
    const response = await fetch("/api/admin/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminId,
        type,
        title,
        message,
        link,
      }),
    });
    return response.ok;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return false;
  }
}

