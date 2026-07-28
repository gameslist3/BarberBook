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
