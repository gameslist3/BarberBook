"use client";

import { Bell, CheckCircle2, XCircle, AlertTriangle, Info, X, Scissors } from "lucide-react";
import type { NotifItem } from "./useBookingNotifications";

const TYPE_STYLES: Record<string, { icon: any; bg: string; fg: string }> = {
  success: { icon: CheckCircle2, bg: "bg-emerald-100", fg: "text-emerald-600" },
  danger: { icon: XCircle, bg: "bg-red-100", fg: "text-red-600" },
  warning: { icon: AlertTriangle, bg: "bg-amber-100", fg: "text-amber-600" },
  info: { icon: Info, bg: "bg-blue-100", fg: "text-blue-600" },
  booking: { icon: Scissors, bg: "bg-violet-100", fg: "text-violet-600" },
};

interface NotificationsPanelProps {
  notifications: NotifItem[];
  onClearAll: () => void;
  onClose: () => void;
  title?: string;
  emptyTitle?: string;
  emptyMessage?: string;
  accent?: "violet" | "indigo";
}

/**
 * Simple, clean notification list shared by the client / shop / admin headers.
 * Newest items are always at the top (the hook already prepends them).
 */
export function NotificationsPanel({
  notifications,
  onClearAll,
  onClose,
  title = "Notifications",
  emptyTitle = "No notifications yet.",
  emptyMessage = "We'll let you know when something happens.",
  accent = "violet",
}: NotificationsPanelProps) {
  const accentText = accent === "indigo" ? "text-indigo-600" : "text-violet-600";

  return (
    <div className="w-[300px] sm:w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-[999] overflow-hidden" style={{ animation: 'slideUpFade 0.25s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
        <h3 className="font-bold text-gray-900 dark:text-white text-sm">{title}</h3>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <button
              onClick={onClearAll}
              className={`text-xs font-medium ${accentText} hover:opacity-80 transition-opacity`}
            >
              Clear all
            </button>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell size={26} className="mx-auto text-gray-200 mb-2" />
            <p className="text-sm text-gray-500">{emptyTitle}</p>
            {emptyMessage && <p className="text-xs text-gray-400 mt-1">{emptyMessage}</p>}
          </div>
        ) : (
          notifications.map((n) => {
            const style = TYPE_STYLES[n.type || "info"] || TYPE_STYLES.info;
            const Icon = style.icon;
            return (
              <div
                key={n.id}
                className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-900 hover:bg-gray-50 dark:bg-gray-800 transition-colors"
              >
                <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${style.bg} ${style.fg}`}>
                  <Icon size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-gray-900 dark:text-white leading-snug">{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-snug">{n.message}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{n.time}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
