import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { sendPushNotification, sendPushToAll } from "@/lib/notifications-server";

/**
 * POST /api/notifications/send
 * 
 * Send push notification to one or all users.
 * 
 * Body:
 *   - title: string (required)
 *   - body: string (required)
 *   - url?: string
 *   - userId?: string (if empty, sends to all users)
 *   - token?: string (send to specific FCM token)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify the caller is authenticated
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const callerUid = decodedToken.uid;

    // Check if caller is admin
    const callerDoc = await adminDb.collection("users").doc(callerUid).get();
    const callerData = callerDoc.data();
    if (!callerData || callerData.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { title, body: messageBody, url, userId, targetToken } = body;

    if (!title || !messageBody) {
      return NextResponse.json({ error: "title and body are required" }, { status: 400 });
    }

    let tokens: string[] = [];

    if (targetToken) {
      // Send to specific token
      tokens = [targetToken];
    } else if (userId) {
      // Send to specific user
      const tokenDoc = await adminDb.collection("fcmTokens").doc(userId).get();
      if (tokenDoc.exists) {
        tokens = [tokenDoc.data()!.token];
      }
    } else {
      // Send to all users
      const tokensSnapshot = await adminDb.collection("fcmTokens").get();
      tokens = tokensSnapshot.docs.map((doc) => doc.data().token);
    }

    if (tokens.length === 0) {
      return NextResponse.json({ message: "No tokens found", sent: 0 });
    }

    // Queue notifications for sending
    let sent = 0;
    for (const tokenStr of tokens) {
      const ok = await sendPushNotification(tokenStr, title, messageBody, url);
      if (ok) sent++;
    }

    return NextResponse.json({
      message: "Notifications queued",
      sent,
    });
  } catch (error: any) {
    console.error("Error sending notification:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
