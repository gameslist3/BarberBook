"use server";

import { adminDb } from "@/lib/firebase-admin";
import { getServerUser } from "@/lib/get-server-user";
import { revalidatePath } from "next/cache";
import { getOvertimeInfo } from "@/lib/timeUtils";

/** Maximum overtime before a booking auto-completes (15 minutes). */
const MAX_OVERTIME_SECONDS = 15 * 60;

async function getShopForCurrentUser() {
  const user = await getServerUser();
  if (!user) throw new Error("Unauthorized");
  
  const shopsSnapshot = await adminDb.collection("shops").where("ownerId", "==", user.id).limit(1).get();
  if (shopsSnapshot.empty) throw new Error("No shop profile found.");
  
  return { ...shopsSnapshot.docs[0].data(), id: shopsSnapshot.docs[0].id };
}

export async function getShopBookings() {
  try {
    const shop = await getShopForCurrentUser();
    const bookingsSnapshot = await adminDb.collection("bookings")
        .where("shopId", "==", shop.id)
        .get();
        
    // In Firestore, sorting after filtering on a different field requires a composite index.
    // For simplicity, we can sort it in memory for now.
    const bookings = await Promise.all(bookingsSnapshot.docs.map(async (doc: any) => {
        const data = doc.data();
        
        const userDoc = await adminDb.collection("users").doc(data.userId).get();
        const userData = userDoc.data() || {};
        
        let services = [];
        if (data.serviceIds && Array.isArray(data.serviceIds)) {
            const serviceDocs = await Promise.all(data.serviceIds.map((id: string) => adminDb.collection("services").doc(id).get()));
            services = serviceDocs.map(doc => ({
                id: doc.id,
                ...(doc.data() || {}),
                createdAt: doc.data()?.createdAt?.toDate?.()?.toISOString() || doc.data()?.createdAt
            }));
        } else if (data.serviceId) {
            const serviceDoc = await adminDb.collection("services").doc(data.serviceId).get();
            services = [{
                id: data.serviceId,
                ...(serviceDoc.data() || {}),
                createdAt: serviceDoc.data()?.createdAt?.toDate?.()?.toISOString() || serviceDoc.data()?.createdAt
            }];
        }
        
        return {
            id: doc.id,
            ...data,
            user: { 
                id: data.userId, 
                ...userData,
                createdAt: userData.createdAt?.toDate?.()?.toISOString() || userData.createdAt 
            },
            services,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        };
    }));
    
    // ── Auto-complete bookings whose overtime exceeded 15 minutes ──────────
    // The client cards show "Over Time" while the service runs; if the shop
    // owner never taps Complete, the booking would stay open forever. Enforce
    // a hard ceiling here: any confirmed/pending booking that ended more than
    // 15 minutes ago is automatically marked completed.
    const autoCompletedIds = new Set<string>();
    for (const b of bookings) {
      if (b.status !== "confirmed" && b.status !== "pending") continue;
      const totalDuration = (b.services || []).reduce(
        (acc: number, s: any) => acc + (parseInt(s.duration, 10) || 30),
        0
      ) || 30;
      const { isOvertime, overtimeSeconds } = getOvertimeInfo(
        b.slotDate,
        b.slotStartTime,
        totalDuration
      );
      if (isOvertime && overtimeSeconds > MAX_OVERTIME_SECONDS) {
        autoCompletedIds.add(b.id);
      }
    }
    if (autoCompletedIds.size > 0) {
      await Promise.all(
        [...autoCompletedIds].map((id) =>
          adminDb.collection("bookings").doc(id).update({
            status: "completed",
            updatedAt: new Date(),
            autoCompleted: true,
          })
        )
      );
    }

    // Sort in memory by slotDate then slotStartTime
    bookings.sort((a: any, b: any) => {
        if (a.slotDate === b.slotDate) {
            return a.slotStartTime.localeCompare(b.slotStartTime);
        }
        return a.slotDate.localeCompare(b.slotDate);
    });
    
    return bookings.map((b: any) =>
      autoCompletedIds.has(b.id) ? { ...b, status: "completed" } : b
    );
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return [];
  }
}

export async function updateBookingStatus(bookingId: string, newStatus: string) {
  try {
    const shop = await getShopForCurrentUser();
    
    const bookingRef = adminDb.collection("bookings").doc(bookingId);
    const bookingDoc = await bookingRef.get();
    
    if (bookingDoc.exists && bookingDoc.data()?.shopId === shop.id) {
        await bookingRef.update({
            status: newStatus,
            updatedAt: new Date()
        });
    } else {
        throw new Error("Unauthorized or not found");
    }
    
    revalidatePath("/shop/bookings");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating booking:", error);
    return { success: false, error: error.message };
  }
}
