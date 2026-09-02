/**
 * Server-side notification helpers.
 * Only import this from API routes or other server code.
 */
import { adminDb } from "./firebase-admin";

/**
 * Send a push notification to a specific token via Firebase Admin.
 * Queues the notification in Firestore for delivery.
 */
export async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  url?: string
): Promise<boolean> {
  try {
    await adminDb.collection("pendingNotifications").add({
      token,
      title,
      body,
      url: url ?? "/",
      status: "pending",
      createdAt: new Date(),
    });
    return true;
  } catch (error) {
    console.error("Error queuing notification:", error);
    return false;
  }
}

/**
 * Send a notification to all subscribed users.
 */
export async function sendPushToAll(
  title: string,
  body: string,
  url?: string
): Promise<number> {
  try {
    const tokensSnapshot = await adminDb.collection("fcmTokens").get();
    const batch = adminDb.batch();

    for (const doc of tokensSnapshot.docs) {
      const ref = adminDb.collection("pendingNotifications").doc();
      batch.set(ref, {
        token: doc.data().token,
        title,
        body,
        url: url || "/",
        status: "pending",
        createdAt: new Date(),
      });
    }

    await batch.commit();
    return tokensSnapshot.size;
  } catch (error) {
    console.error("Error sending to all:", error);
    return 0;
  }
}
