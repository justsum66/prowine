"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

function ToastItem({ toast, onClose }: ToastProps) {
  useEffect(() => {
    if (toast.duration !== 0) {
      const timer = setTimeout(() => {
        onClose(toast.id);
      }, toast.duration || 5000);

      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onClose]);

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  };

  const colors = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };

  const Icon = icons[toast.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`relative flex items-center gap-3 p-4 rounded-lg border shadow-premium ${colors[toast.type]}`}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 p-1 hover:opacity-70 transition-opacity"
        aria-label="關閉"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-20 right-4 md:right-4 bottom-20 md:bottom-auto left-4 md:left-auto z-50 flex flex-col gap-2 max-w-md md:max-w-md w-auto md:w-auto">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Toast Hook
let toastIdCounter = 0;
const toastListeners: Array<(toast: Toast) => void> = [];

export function useToast() {
  const showToast = (type: ToastType, message: string, duration?: number) => {
    const toast: Toast = {
      id: `toast-${++toastIdCounter}`,
      type,
      message,
      duration,
    };
    toastListeners.forEach((listener) => listener(toast));
  };

  return {
    success: (message: string, duration?: number) => showToast("success", message, duration),
    error: (message: string, duration?: number) => showToast("error", message, duration),
    warning: (message: string, duration?: number) => showToast("warning", message, duration),
    info: (message: string, duration?: number) => showToast("info", message, duration),
  };
}

// Global Toast Provider
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  React.useEffect(() => {
    const listener = (toast: Toast) => {
      setToasts((prev) => [...prev, toast]);
    };
    toastListeners.push(listener);

    return () => {
      const index = toastListeners.indexOf(listener);
      if (index > -1) {
        toastListeners.splice(index, 1);
      }
    };
  }, []);

  const handleClose = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <>
      {children}
      <ToastContainer toasts={toasts} onClose={handleClose} />
    </>
  );
}

