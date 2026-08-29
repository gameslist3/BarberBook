"use client";

import { useEffect, useState } from "react";
import { onForegroundMessage } from "@/lib/notifications";
import { X, Bell } from "lucide-react";

interface NotificationToast {
  id: number;
  title: string;
  body: string;
  url?: string;
}

let toastId = 0;

export function NotificationListener() {
  const [toasts, setToasts] = useState<NotificationToast[]>([]);

  useEffect(() => {
    const unsubscribe = onForegroundMessage((payload) => {
      const newToast: NotificationToast = {
        id: ++toastId,
        title: payload.notification?.title || "BarberBook",
        body: payload.notification?.body || "",
        url: payload.data?.url as string,
      };
      setToasts((prev) => [...prev, newToast]);

      // Auto-remove after 6 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 6000);
    });

    return unsubscribe;
  }, []);

  const dismiss = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleClick = (url?: string) => {
    if (url) window.location.href = url;
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => handleClick(toast.url)}
          className="bg-gray-900 border border-white/10 rounded-xl p-4 shadow-2xl cursor-pointer hover:bg-gray-800 transition-all animate-slide-in"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">{toast.title}</p>
              <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{toast.body}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                dismiss(toast.id);
              }}
              className="text-gray-500 hover:text-white shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
