"use client";

import { useState } from "react";
import { auth } from "./firebase";

interface SendNotificationResult {
  success: boolean;
  sent?: number;
  error?: string;
}

/**
 * Hook to send push notifications from the admin panel.
 */
export function useSendNotification() {
  const [loading, setLoading] = useState(false);

  const sendNotification = async (
    title: string,
    body: string,
    options?: { url?: string; userId?: string; targetToken?: string }
  ): Promise<SendNotificationResult> => {
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        return { success: false, error: "Not authenticated" };
      }

      const idToken = await user.getIdToken();

      const response = await fetch("/api/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          title,
          body,
          url: options?.url,
          userId: options?.userId,
          targetToken: options?.targetToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error };
      }

      return { success: true, sent: data.sent };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return { sendNotification, loading };
}
