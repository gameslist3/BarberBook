"use server";

import { adminDb } from "@/lib/firebase-admin";
import { getServerUser } from "@/lib/get-server-user";
import { revalidatePath } from "next/cache";

export interface HistoryService {
  name: string;
  price: number;
  duration: number;
}

export interface HistoryBooking {
  id: string;
  slotDate: string;
  slotStartTime: string;
  status: string;
  shopId: string;
  shopName: string;
  userId: string;
  user: { name: string; email: string; phone: string; photoUrl: string };
  services: HistoryService[];
  totalPrice: number;
  totalDuration: number;
  createdAt: string | null;
}

export interface HistoryResult {
  bookings: HistoryBooking[];
  shopName: string;
}

async function getShopForCurrentUser(): Promise<{ id: string; shopName: string }> {
  const user = await getServerUser();
  if (!user) throw new Error("Unauthorized");

  const shopsSnapshot = await adminDb.collection("shops").where("ownerId", "==", user.id).limit(1).get();
  if (shopsSnapshot.empty) throw new Error("No shop profile found.");

  const data = shopsSnapshot.docs[0].data();
  return { id: shopsSnapshot.docs[0].id, shopName: data.shopName || "" };
}

/**
 * Fetches booking history for a date range.
 * - SHOP_OWNER → only their own shop's bookings.
 * - ADMIN / APP_OWNER → all bookings, or a single shop if `shopId` is passed.
 * - Any other role → empty result.
 *
 * Note: to avoid requiring a Firestore composite index, bookings are fetched
 * by shop (or all) and filtered by date range in memory — consistent with the
 * rest of this codebase.
 */
export async function getBookingHistory(params: {
  startDate: string;
  endDate: string;
  shopId?: string;
}): Promise<HistoryResult> {
  const user = await getServerUser();
  if (!user) return { bookings: [], shopName: "" };

  const isAdmin = user.role === "ADMIN" || user.role === "APP_OWNER";
  const isShopOwner = user.role === "SHOP_OWNER";
  if (!isAdmin && !isShopOwner) return { bookings: [], shopName: "" };

  try {
    let shopId: string | null = null;
    let shopName = "";

    if (isShopOwner) {
      const shop = await getShopForCurrentUser();
      shopId = shop.id;
      shopName = shop.shopName;
    } else if (params.shopId) {
      shopId = params.shopId;
      const shopDoc = await adminDb.collection("shops").doc(params.shopId).get();
      shopName = shopDoc.data()?.shopName || "";
    }

    let snapshot;
    if (shopId) {
      snapshot = await adminDb.collection("bookings").where("shopId", "==", shopId).get();
    } else {
      snapshot = await adminDb.collection("bookings").get();
    }

    // History only ever shows finished schedules — Completed, Cancelled or
    // Not Arrive. Upcoming/confirmed bookings belong on the Bookings screen,
    // never here.
    const filteredDocs = snapshot.docs
      .map((doc: any) => ({ id: doc.id, ...doc.data() }))
      .filter(
        (b: any) =>
          b.slotDate >= params.startDate &&
          b.slotDate <= params.endDate &&
          (b.status === "completed" || b.status === "cancelled" || b.status === "no_show")
      );

    // Batch-load referenced users + services + shops (no N+1)
    const userIds = [...new Set(filteredDocs.map((b) => b.userId).filter(Boolean))] as string[];
    const serviceIds = [
      ...new Set(
        filteredDocs.flatMap((b) => b.serviceIds || (b.serviceId ? [b.serviceId] : [])).filter(Boolean)
      ),
    ] as string[];
    const shopIds = [...new Set(filteredDocs.map((b) => b.shopId).filter(Boolean))] as string[];

    const [userDocs, serviceDocs, shopDocs] = await Promise.all([
      Promise.all(
        userIds.map((id) => adminDb.collection("users").doc(id).get().then((d) => ({ id, data: d.data() || {} })))
      ),
      Promise.all(
        serviceIds.map((id) => adminDb.collection("services").doc(id).get().then((d) => ({ id, data: d.data() || {} })))
      ),
      Promise.all(
        shopIds.map((id) => adminDb.collection("shops").doc(id).get().then((d) => ({ id, data: d.data() || {} })))
      ),
    ]);

    const userMap = new Map(userDocs.map((u) => [u.id, u.data]));
    const serviceMap = new Map(serviceDocs.map((s) => [s.id, s.data]));
    const shopMap = new Map(shopDocs.map((s) => [s.id, s.data]));

    const bookings: HistoryBooking[] = filteredDocs.map((b) => {
      const services: HistoryService[] = (b.serviceIds || (b.serviceId ? [b.serviceId] : []))
        .map((id: string) => serviceMap.get(id))
        .filter(Boolean)
        .map((s: any) => ({
          name: s.name || "Service",
          price: Number(s.price) || 0,
          duration: Number(s.duration) || 0,
        }));

      const userData = userMap.get(b.userId) || {};
      const shopData = shopMap.get(b.shopId) || {};

      return {
        id: b.id,
        slotDate: b.slotDate,
        slotStartTime: b.slotStartTime,
        status: b.status || "unknown",
        shopId: b.shopId,
        shopName: shopData.shopName || "",
        userId: b.userId,
        user: {
          name: userData.name || "Unknown",
          email: userData.email || "",
          phone: userData.phone || "",
          photoUrl: userData.photoUrl || "",
        },
        services,
        totalPrice: services.reduce((sum: number, s) => sum + s.price, 0),
        totalDuration: services.reduce((sum: number, s) => sum + s.duration, 0),
        createdAt: b.createdAt?.toDate?.()?.toISOString() || b.createdAt || null,
      };
    });

    // Sort by date, then start time
    bookings.sort((a, b) => {
      if (a.slotDate === b.slotDate) return (a.slotStartTime || "").localeCompare(b.slotStartTime || "");
      return a.slotDate.localeCompare(b.slotDate);
    });

    return { bookings, shopName };
  } catch (error) {
    console.error("Error fetching booking history:", error);
    return { bookings: [], shopName: "" };
  }
}

/**
 * Permanently deletes a booking. Restricted to ADMIN / APP_OWNER — the app
 * owner can remove any schedule data at any time.
 */
export async function deleteAnyBooking(bookingId: string) {
  const user = await getServerUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "APP_OWNER")) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await adminDb.collection("bookings").doc(bookingId).delete();
    revalidatePath("/admin/bookings");
    revalidatePath("/admin/history");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting booking:", error);
    return { success: false, error: error.message };
  }
}
