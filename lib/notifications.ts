import { getMessagingInstance } from "./firebase";
import {
  getToken,
  onMessage,
  type MessagePayload,
} from "firebase/messaging";
import { doc, setDoc, deleteDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

// VAPID key — generate yours at https://console.firebase.google.com/project/thebarberbook/settings/cloudmessaging
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? "";

/**
 * Request notification permission and get FCM token.
 * Stores the token in Firestore so the server can send push notifications.
 */
export async function requestNotificationPermission(
  userId: string
): Promise<{ granted: boolean; token?: string; error?: string }> {
  try {
    if (typeof window === "undefined") {
      return { granted: false, error: "Not in browser" };
    }

    // Check if notifications are supported
    if (!("Notification" in window)) {
      return { granted: false, error: "Notifications not supported" };
    }

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { granted: false, error: "Permission denied" };
    }

    // Get FCM token
    const messaging = await getMessagingInstance();
    if (!messaging) {
      return { granted: false, error: "Messaging not supported" };
    }

    if (!VAPID_KEY) {
      console.warn("VAPID key not configured. Push notifications won't work until you add NEXT_PUBLIC_FIREBASE_VAPID_KEY.");
      return { granted: false, error: "VAPID key not configured" };
    }

    const token = await getToken(messaging, { vapidKey: VAPID_KEY });

    // Store token in Firestore
    await setDoc(doc(db, "fcmTokens", userId), {
      token,
      userId,
      createdAt: serverTimestamp(),
      platform: "web",
    });

    return { granted: true, token };
  } catch (error: any) {
    console.error("Error getting notification permission:", error);
    return { granted: false, error: error.message };
  }
}

/**
 * Remove FCM token from Firestore (user unsubscribed).
 */
export async function unsubscribeNotifications(userId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "fcmTokens", userId));
  } catch (error) {
    console.error("Error removing notification token:", error);
  }
}

/**
 * Check if user has notifications enabled.
 */
export async function isNotificationsEnabled(userId: string): Promise<boolean> {
  try {
    const docSnap = await getDoc(doc(db, "fcmTokens", userId));
    return docSnap.exists();
  } catch {
    return false;
  }
}

/**
 * Listen for foreground messages (when app is open).
 * Call this in a React component to show in-app notifications.
 */
export function onForegroundMessage(
  callback: (payload: MessagePayload) => void
): () => void {
  let unsubscribe: (() => void) | null = null;

  (async () => {
    const messaging = await getMessagingInstance();
    if (!messaging) return;

    unsubscribe = onMessage(messaging, (payload) => {
      callback(payload);
    });
  })();

  return () => {
    unsubscribe?.();
  };
}


