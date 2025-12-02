"use client";

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { NotificationService } from "@/lib/utils/notification";

interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}
import { useAdminAuth } from "@/lib/contexts/AdminAuthContext";

export default function NotificationBell() {
  const { admin } = useAdminAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [notificationService, setNotificationService] = useState<NotificationService | null>(null);

  useEffect(() => {
    if (!admin?.id) return;

    const service = new NotificationService(admin.id);
    setNotificationService(service);

    // 連接通知服務
    service.connect((notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    // 獲取初始數據
    loadNotifications();
    loadUnreadCount();

    return () => {
      service.disconnect();
    };
  }, [admin?.id]);

  const loadNotifications = async () => {
    if (!notificationService) return;
    const allNotifications = await notificationService.getAllNotifications(20);
    setNotifications(allNotifications);
  };

  const loadUnreadCount = async () => {
    if (!notificationService) return;
    const count = await notificationService.getUnreadCount();
    setUnreadCount(count);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    if (!notificationService) return;
    const success = await notificationService.markAsRead(notificationId);
    if (success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!notificationService) return;
    const unreadNotifications = notifications.filter((n) => !n.read);
    await Promise.all(unreadNotifications.map((n) => notificationService.markAsRead(n.id)));
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 z-50"
          >
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">通知</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    全部標記為已讀
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-neutral-500 dark:text-neutral-400">
                  沒有通知
                </div>
              ) : (
                <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-neutral-50 dark:hover:bg-neutral-900/30 cursor-pointer ${
                        !notification.read ? "bg-blue-50 dark:bg-blue-900/20" : ""
                      }`}
                      onClick={() => {
                        if (!notification.read) {
                          handleMarkAsRead(notification.id);
                        }
                        if (notification.link) {
                          window.location.href = notification.link;
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-2 h-2 rounded-full mt-2 ${
                            !notification.read ? "bg-primary-600" : "bg-transparent"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-neutral-900 dark:text-neutral-100">
                            {notification.title}
                          </p>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                            {new Date(notification.createdAt).toLocaleString("zh-TW")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

