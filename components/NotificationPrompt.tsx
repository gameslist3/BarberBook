"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, X } from "lucide-react";
import { auth } from "@/lib/firebase";
import {
  requestNotificationPermission,
  unsubscribeNotifications,
  isNotificationsEnabled,
} from "@/lib/notifications";

export function NotificationPrompt() {
  const [show, setShow] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Check if already dismissed this session
    if (sessionStorage.getItem("notif-prompt-dismissed")) return;

    // Check current state
    isNotificationsEnabled(user.uid).then((isEnabled) => {
      setEnabled(isEnabled);
      if (!isEnabled) {
        // Show prompt after 5 seconds if not enabled
        setTimeout(() => setShow(true), 5000);
      }
    });
  }, []);

  const handleEnable = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    const result = await requestNotificationPermission(user.uid);
    setLoading(false);

    if (result.granted) {
      setEnabled(true);
      setShow(false);
    }
  };

  const handleDisable = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    await unsubscribeNotifications(user.uid);
    setLoading(false);
    setEnabled(false);
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    sessionStorage.setItem("notif-prompt-dismissed", "true");
  };

  // Don't show if dismissed or enabled
  if (dismissed || !show) {
    return (
      <button
        onClick={async () => {
          if (enabled) {
            await handleDisable();
          } else {
            setShow(true);
          }
        }}
        className="fixed bottom-24 right-4 z-50 bg-white dark:bg-gray-900/10 backdrop-blur-md border border-white/20 rounded-full p-3 shadow-lg hover:bg-white dark:bg-gray-900/20 transition-all"
        title={enabled ? "Disable notifications" : "Enable notifications"}
      >
        {enabled ? (
          <Bell className="w-5 h-5 text-green-400" />
        ) : (
          <BellOff className="w-5 h-5 text-gray-400" />
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 right-4 z-50 max-w-sm">
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-gray-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="w-12 h-12 bg-white dark:bg-gray-900/10 rounded-xl flex items-center justify-center mb-3">
          <Bell className="w-6 h-6 text-white" />
        </div>

        {/* Content */}
        <h3 className="text-white font-semibold text-lg mb-1">
          Stay Updated
        </h3>
        <p className="text-gray-400 text-sm mb-4">
          Get notified about booking confirmations, reminders, and appointment updates.
        </p>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleEnable}
            disabled={loading}
            className="flex-1 bg-white dark:bg-gray-900 text-black font-semibold py-2.5 px-4 rounded-xl text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {loading ? "Setting up..." : "Enable Notifications"}
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2.5 text-gray-400 hover:text-white text-sm transition-colors"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
