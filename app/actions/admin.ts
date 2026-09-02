"use server";

import { adminDb } from "@/lib/firebase-admin";
import { getServerUser } from "@/lib/get-server-user";

export async function getAdminDashboardStats() {
  const user = await getServerUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "APP_OWNER")) {
    return { totalShops: 0, totalUsers: 0, totalBookings: 0, revenue: 0 };
  }

  try {
    const [shopsSnapshot, usersSnapshot, bookingsSnapshot] = await Promise.all([
      adminDb.collection("shops").get(),
      adminDb.collection("users").get(),
      adminDb.collection("bookings").get()
    ]);

    const bookings = bookingsSnapshot.docs.map(doc => doc.data());
    const totalBookings = bookings.length;
    
    // Estimate revenue (sum of prices for completed bookings, roughly)
    // Actually we don't store prices in bookings currently, so we'll just leave it at 0 for now or calculate based on services if available.
    // Let's just mock it or say N/A for MVP, or calculate if service prices are cached.
    let revenue = 0;
    
    return {
      totalShops: shopsSnapshot.size,
      totalUsers: usersSnapshot.size,
      totalBookings: totalBookings,
      revenue: revenue
    };
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return { totalShops: 0, totalUsers: 0, totalBookings: 0, revenue: 0 };
  }
}

export async function toggleUserStatus(userId: string, isActive: boolean) {
  const user = await getServerUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "APP_OWNER")) return { success: false };

  // App Owner accounts cannot be deactivated
  try {
    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (userDoc.exists && userDoc.data()?.role === "APP_OWNER") {
      return { success: false, error: "App Owner accounts cannot be deactivated." };
    }
  } catch (e) { /* continue */ }

  try {
    await adminDb.collection("users").doc(userId).update({ isActive });
    
    // If shop owner, also toggle their shop
    const userDoc2 = await adminDb.collection("users").doc(userId).get();
    if (userDoc2.exists && userDoc2.data()?.role === "SHOP_OWNER") {
        const shopsSnap = await adminDb.collection("shops").where("ownerId", "==", userId).get();
        if (!shopsSnap.empty) {
            await adminDb.collection("shops").doc(shopsSnap.docs[0].id).update({ isActive });
        }
    }
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteUserAccount(userId: string) {
  const user = await getServerUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "APP_OWNER")) return { success: false };

  // App Owner accounts cannot be deleted
  try {
    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (userDoc.exists && userDoc.data()?.role === "APP_OWNER") {
      return { success: false, error: "App Owner accounts cannot be deleted." };
    }
  } catch (e) { /* continue */ }

  try {
    const userDoc = await adminDb.collection("users").doc(userId).get();
    
    // Delete Auth user
    try {
        const { adminAuth } = await import("@/lib/firebase-admin");
        await adminAuth.deleteUser(userId);
    } catch (e) {
        console.log("Auth user might not exist or err:", e);
    }
    
    // If shop owner, delete shop
    if (userDoc.exists && userDoc.data()?.role === "SHOP_OWNER") {
        const shopsSnap = await adminDb.collection("shops").where("ownerId", "==", userId).get();
        if (!shopsSnap.empty) {
            await adminDb.collection("shops").doc(shopsSnap.docs[0].id).delete();
        }
    }
    
    // Delete user doc
    await adminDb.collection("users").doc(userId).delete();
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
