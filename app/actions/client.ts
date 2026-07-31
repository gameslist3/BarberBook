"use server";

import { adminDb } from "@/lib/firebase-admin";
import { getServerUser } from "@/lib/get-server-user";
import { getKolkataDateString } from "@/lib/timeUtils";

export async function getAllActiveShops() {
  try {
    const shopsSnapshot = await adminDb.collection("shops").where("isActive", "==", true).get();
    
    return await Promise.all(shopsSnapshot.docs.map(async (doc: any) => {
        const data = doc.data();
        const ownerDoc = await adminDb.collection("users").doc(data.ownerId).get();
        const ownerData = ownerDoc.data() || {};
        return {
            id: doc.id,
            ...data,
            owner: { 
                id: data.ownerId, 
                ...ownerData,
                createdAt: ownerData.createdAt?.toDate?.()?.toISOString() || ownerData.createdAt
            },
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
            accessExpiresAt: data.accessExpiresAt?.toDate?.()?.toISOString() || data.accessExpiresAt,
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || null,
        };
    }));
  } catch (error) {
    console.error("Failed to fetch shops:", error);
    return [];
  }
}

export async function getShopDetails(shopId: string) {
  try {
    const shopDoc = await adminDb.collection("shops").doc(shopId).get();
    if (!shopDoc.exists) return null;
    
    const data = shopDoc.data();
    
    const [ownerDoc, servicesSnapshot] = await Promise.all([
        adminDb.collection("users").doc(data?.ownerId).get(),
        adminDb.collection("services").where("shopId", "==", shopId).get()
    ]);
    
    const services = servicesSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    
    const ownerData = ownerDoc.data() || {};
    return {
        id: shopDoc.id,
        ...data,
        owner: { 
            id: data?.ownerId, 
            ...ownerData,
            createdAt: ownerData.createdAt?.toDate?.()?.toISOString() || ownerData.createdAt
        },
        services,
        createdAt: data?.createdAt?.toDate?.()?.toISOString() || data?.createdAt,
        accessExpiresAt: data?.accessExpiresAt?.toDate?.()?.toISOString() || data?.accessExpiresAt,
        updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || data?.updatedAt || null,
    };
  } catch (error) {
    console.error("Failed to fetch shop details:", error);
    return null;
  }
}

/**
 * Checks if the current user already has an active (confirmed/pending) booking
 * that hasn't ended yet (slotEndTime is still in the future, or the booking
 * is on a future date).
 */
export async function checkUserActiveBooking(): Promise<{ hasActive: boolean; booking?: any }> {
  const user = await getServerUser();
  if (!user) return { hasActive: false };

  try {
    const today = getKolkataDateString();
    const bookingsSnapshot = await adminDb.collection("bookings")
      .where("userId", "==", user.id)
      .where("slotDate", ">=", today)
      .where("status", "in", ["confirmed", "pending"])
      .get();

    if (bookingsSnapshot.empty) return { hasActive: false };

    // Gather all unique service IDs to resolve durations
    const allServiceIds = [...new Set(
      bookingsSnapshot.docs.flatMap(doc => doc.data().serviceIds || [])
    )];
    const servicesMap: Record<string, number> = {};
    if (allServiceIds.length > 0) {
      for (let i = 0; i < allServiceIds.length; i += 10) {
        const chunk = allServiceIds.slice(i, i + 10);
        const servicesSnapshot = await adminDb.collection("services").where("__name__", "in", chunk).get();
        servicesSnapshot.docs.forEach(doc => {
          servicesMap[doc.id] = parseInt(doc.data().duration, 10) || 30;
        });
      }
    }

    // Get current time in IST for comparison
    const options = { timeZone: 'Asia/Kolkata' };
    const now = new Date();
    const istString = now.toLocaleString('en-US', options);
    const istDate = new Date(istString);
    const currentMinutes = istDate.getHours() * 60 + istDate.getMinutes();

    // Check each booking to see if it's still active
    for (const doc of bookingsSnapshot.docs) {
      const data = doc.data();
      const startMins = parseTimeToMinutes(data.slotStartTime);
      const bookingServiceIds: string[] = data.serviceIds || [];
      const duration = bookingServiceIds.reduce((total, id) => total + (servicesMap[id] || 30), 0) || 30;
      const endMins = startMins + duration;

      // A booking is still active if:
      // - It's on a future date (hasn't occurred yet), OR
      // - It's today and the end time is still ahead
      const isFutureDate = data.slotDate > today;
      const isActiveToday = data.slotDate === today && endMins > currentMinutes;

      if (isFutureDate || isActiveToday) {
        return { 
          hasActive: true, 
          booking: { 
            id: doc.id, 
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          }
        };
      }
    }

    return { hasActive: false };
  } catch (error) {
    console.error("Failed to check active bookings:", error);
    return { hasActive: false };
  }
}

/**
 * Returns the user's currently active booking enriched with shop + service
 * details — used by the locked "/session" screen after booking.
 */
export async function getActiveSession() {
  const user = await getServerUser();
  if (!user) return { hasActive: false, session: null };

  try {
    const today = getKolkataDateString();
    const bookingsSnapshot = await adminDb.collection("bookings")
      .where("userId", "==", user.id)
      .where("slotDate", ">=", today)
      .where("status", "in", ["confirmed", "pending"])
      .get();

    if (bookingsSnapshot.empty) return { hasActive: false, session: null };

    // Sort bookings so the earliest active one is returned first
    const sortedDocs = bookingsSnapshot.docs.slice().sort((a: any, b: any) => {
      const da = a.data().slotDate || "";
      const db = b.data().slotDate || "";
      if (da === db) return (a.data().slotStartTime || "").localeCompare(b.data().slotStartTime || "");
      return da.localeCompare(db);
    });

    // Gather all unique service IDs to resolve names + durations
    const allServiceIds = [...new Set(
      bookingsSnapshot.docs.flatMap(doc => doc.data().serviceIds || [])
    )];
    const servicesMap: Record<string, any> = {};
    if (allServiceIds.length > 0) {
      for (let i = 0; i < allServiceIds.length; i += 10) {
        const chunk = allServiceIds.slice(i, i + 10);
        const servicesSnapshot = await adminDb.collection("services").where("__name__", "in", chunk).get();
        servicesSnapshot.docs.forEach(doc => {
          servicesMap[doc.id] = { id: doc.id, ...doc.data() };
        });
      }
    }

    // Current time in IST — the app's canonical clock for bookings
    const nowStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const istDate = new Date(nowStr);
    const currentMinutes = istDate.getHours() * 60 + istDate.getMinutes();

    for (const doc of sortedDocs) {
      const data = doc.data();
      const startMins = parseTimeToMinutes(data.slotStartTime);
      const bookingServiceIds: string[] = data.serviceIds || [];
      const services = bookingServiceIds.map(id => servicesMap[id]).filter(Boolean);
      const duration = services.reduce((total, s) => total + (parseInt(s.duration, 10) || 30), 0) || 30;
      const endMins = startMins + duration;

      const isFutureDate = data.slotDate > today;
      const isActiveToday = data.slotDate === today && endMins > currentMinutes;
      if (isFutureDate || isActiveToday) {
        const shopDoc = await adminDb.collection("shops").doc(data.shopId).get();
        const shop = shopDoc.exists ? (shopDoc.data() || {}) : {};
        return {
          hasActive: true,
          session: {
            id: doc.id,
            slotDate: data.slotDate,
            slotStartTime: data.slotStartTime,
            status: data.status,
            shop: {
              id: data.shopId,
              shopName: shop.shopName || "",
              logoUrl: shop.logoUrl || null,
            },
            services,
            totalDuration: duration,
            totalPrice: services.reduce((sum, s) => sum + (Number(s.price) || 0), 0),
          },
        };
      }
    }

    return { hasActive: false, session: null };
  } catch (error) {
    console.error("Failed to get active session:", error);
    return { hasActive: false, session: null };
  }
}

export async function createBooking(data: { shopId: string, serviceIds: string[], time: string }) {
  const user = await getServerUser();
  
  if (!user) {
    return { success: false, error: "You must be signed in to book an appointment." };
  }
  
  // Check if user already has an active booking
  const activeCheck = await checkUserActiveBooking();
  if (activeCheck.hasActive) {
    return { success: false, error: "You already have an active booking that hasn't ended yet. Please wait until it finishes." };
  }
  
  try {
    const bookingRef = adminDb.collection("bookings").doc();
    const todayStr = getKolkataDateString();

    // ── Server-side conflict guard ──────────────────────────────
    // The picker already flags conflicts live, but enforce it here too so two
    // users can never race and both book the same slot.
    const schedule = await getShopSchedule(data.shopId, todayStr);
    if (schedule) {
      const requestedMins = parseTimeToMinutes(data.time);
      // Resolve the new booking's own service durations
      const newServiceIds = [...new Set(data.serviceIds.filter(Boolean))];
      const newDurations = newServiceIds.length > 0 ? await resolveServiceDurations(newServiceIds) : {};
      const newDuration = newServiceIds.reduce((total, id) => total + (newDurations[id] || 30), 0) || 30;
      const ist = getIstNow();
      const isPast = todayStr === ist.dateStr && requestedMins <= ist.minutes;
      const overlaps = schedule.occupiedBlocks.some(block =>
        Math.max(requestedMins, block.start) < Math.min(requestedMins + newDuration, block.end)
      );
      if (isPast || overlaps) {
        return { success: false, error: "That time is no longer available. Please pick another time." };
      }
    }

    const bookingData = {
        slotDate: todayStr,
        slotStartTime: data.time,
        shopId: data.shopId,
        serviceIds: data.serviceIds,
        userId: user.id,
        status: "confirmed",
        createdAt: new Date(),
        updatedAt: new Date()
    };
    
    await bookingRef.set(bookingData);
    
    return { success: true, booking: { id: bookingRef.id, ...bookingData } };
  } catch (error: any) {
    console.error("Booking error:", error);
    return { success: false, error: "Failed to create booking." };
  }
}

// Helper to convert "HH:mm AM/PM" to minutes from midnight
function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return 0;
  
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3]?.toUpperCase();
  
  if (ampm === "PM" && hours < 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;
  
  return hours * 60 + minutes;
}

// Helper to format minutes from midnight to "h:mm A"
function formatMinutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  const displayM = m.toString().padStart(2, '0');
  return `${displayH}:${displayM} ${ampm}`;
}

export async function getMyUpcomingBookings() {
  try {
    const user = await getServerUser();
    if (!user) return [];

    const today = getKolkataDateString();
    const bookingsSnapshot = await adminDb.collection("bookings")
      .where("userId", "==", user.id)
      .where("slotDate", ">=", today)
      .where("status", "in", ["confirmed", "pending"])
      .get();

    const shopIds = [...new Set(bookingsSnapshot.docs.map(d => d.data().shopId))];
    const shopsData: Record<string, any> = {};
    for (const id of shopIds) {
      const doc = await adminDb.collection("shops").doc(id).get();
      if (doc.exists) shopsData[id] = { id: doc.id, ...doc.data() };
    }

    const bookings = await Promise.all(bookingsSnapshot.docs.map(async (doc: any) => {
      const data = doc.data();
      const shop = shopsData[data.shopId];
      return {
        id: doc.id,
        ...data,
        shop: shop ? { shopName: shop.shopName, logoUrl: shop.logoUrl, id: shop.id } : null,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      };
    }));

    // Sort by date then time
    bookings.sort((a: any, b: any) => {
      if (a.slotDate === b.slotDate) {
        return (a.slotStartTime || "").localeCompare(b.slotStartTime || "");
      }
      return a.slotDate.localeCompare(b.slotDate);
    });

    return bookings;
  } catch (error) {
    console.error("Failed to fetch upcoming bookings:", error);
    return [];
  }
}

// ── Shared schedule helpers ────────────────────────────────────────
// Current time in IST — the app's canonical clock for bookings
function getIstNow() {
  const options = { timeZone: 'Asia/Kolkata' };
  const istString = new Date().toLocaleString('en-US', options);
  const istDate = new Date(istString);
  const istYear = istDate.getFullYear();
  const istMonth = String(istDate.getMonth() + 1).padStart(2, '0');
  const istDay = String(istDate.getDate()).padStart(2, '0');
  return {
    dateStr: `${istYear}-${istMonth}-${istDay}`,
    minutes: istDate.getHours() * 60 + istDate.getMinutes(),
  };
}

// Resolve durations for a batch of service IDs (chunked query, max 10 per call)
async function resolveServiceDurations(serviceIds: string[]): Promise<Record<string, number>> {
  const servicesMap: Record<string, number> = {};
  for (let i = 0; i < serviceIds.length; i += 10) {
    const chunk = serviceIds.slice(i, i + 10);
    const servicesSnapshot = await adminDb.collection("services").where("__name__", "in", chunk).get();
    servicesSnapshot.docs.forEach(doc => {
      servicesMap[doc.id] = parseInt(doc.data().duration, 10) || 30;
    });
  }
  return servicesMap;
}

// Load a shop's hours + the occupied booking blocks for a date
async function getShopSchedule(shopId: string, dateStr: string) {
  const shopDoc = await adminDb.collection("shops").doc(shopId).get();
  if (!shopDoc.exists) return null;
  const shopData = shopDoc.data();
  
  // Default to 9:00 AM - 6:00 PM if not specified
  const openTimeStr = shopData?.openTime || "9:00 AM";
  const closeTimeStr = shopData?.closeTime || "6:00 PM";
  
  const openMinutes = parseTimeToMinutes(openTimeStr);
  const closeMinutes = parseTimeToMinutes(closeTimeStr);
  
  // Fetch all confirmed/pending bookings for this shop on this date
  const bookingsSnapshot = await adminDb.collection("bookings")
      .where("shopId", "==", shopId)
      .where("slotDate", "==", dateStr)
      .where("status", "in", ["confirmed", "pending"])
      .get();
      
  // We need the durations of the booked services to know when they end
  const serviceIds = [...new Set(bookingsSnapshot.docs.flatMap(doc => doc.data().serviceIds || [doc.data().serviceId]).filter(Boolean))];
  const servicesMap = serviceIds.length > 0 ? await resolveServiceDurations(serviceIds) : {};
  
  // Build a list of occupied blocks [startMinutes, endMinutes]
  const occupiedBlocks: { start: number, end: number }[] = [];
  bookingsSnapshot.docs.forEach(doc => {
    const data = doc.data();
    // Skip bookings without a start time — they can't block the schedule
    if (!data.slotStartTime) return;
    const startMins = parseTimeToMinutes(data.slotStartTime);
    const bookingServiceIds: string[] = data.serviceIds || (data.serviceId ? [data.serviceId] : []);
    const duration = bookingServiceIds.reduce((total, id) => total + (servicesMap[id] || 30), 0) || 30;
    occupiedBlocks.push({ start: startMins, end: startMins + duration });
  });
  occupiedBlocks.sort((a, b) => a.start - b.start);

  return { openMinutes, closeMinutes, occupiedBlocks };
}

// Walk past occupied blocks → the next free start time (formatted) or null
function computeNextAvailable(
  openMinutes: number,
  closeMinutes: number,
  occupiedBlocks: { start: number, end: number }[],
  dateStr: string,
  serviceDurationMinutes: number
): string | null {
  const ist = getIstNow();

  // Earliest possible start:
  // - Past date → nothing available
  // - Today → one minute from now (but never before opening time)
  // - Future date → opening time
  let candidate: number;
  if (dateStr < ist.dateStr) return null;
  if (dateStr === ist.dateStr) candidate = Math.max(ist.minutes + 1, openMinutes);
  else candidate = openMinutes;

  // Walk past any bookings the new appointment would overlap, so the next
  // available time is always immediately after the current time or right
  // after the last booked service ends — no fixed intervals, no gaps.
  while (true) {
    const overlapping = occupiedBlocks.find(
      (block) => candidate < block.end && block.start < candidate + serviceDurationMinutes
    );
    if (!overlapping) break;
    candidate = overlapping.end + 1;
  }

  if (candidate + serviceDurationMinutes > closeMinutes) return null;
  return formatMinutesToTime(candidate);
}

export async function getAvailableSlots(shopId: string, dateStr: string, serviceDurationMinutes: number) {
  try {
    const schedule = await getShopSchedule(shopId, dateStr);
    if (!schedule) return [];
    const next = computeNextAvailable(
      schedule.openMinutes,
      schedule.closeMinutes,
      schedule.occupiedBlocks,
      dateStr,
      serviceDurationMinutes
    );
    return next ? [next] : [];
  } catch (error) {
    console.error("Failed to generate slots:", error);
    return [];
  }
}

/**
 * Live availability check for the "Custom Time" picker — mirrors the next-slot
 * logic so a custom time that's already booked / in the past shows as
 * unavailable, with the next free time suggested as a quick fix.
 */
export async function checkCustomTimeAvailability(
  shopId: string,
  dateStr: string,
  timeStr: string,
  serviceDurationMinutes: number
) {
  try {
    const schedule = await getShopSchedule(shopId, dateStr);
    if (!schedule) return { available: false, reason: "closed", nextAvailable: null };

    const requestedMins = parseTimeToMinutes(timeStr);
    const ist = getIstNow();

    // In the past (today) → not available
    if (dateStr === ist.dateStr && requestedMins <= ist.minutes) {
      return {
        available: false,
        reason: "past",
        nextAvailable: computeNextAvailable(
          schedule.openMinutes, schedule.closeMinutes, schedule.occupiedBlocks, dateStr, serviceDurationMinutes
        ),
      };
    }

    // Outside shop hours
    if (requestedMins < schedule.openMinutes || requestedMins + serviceDurationMinutes > schedule.closeMinutes) {
      return {
        available: false,
        reason: "hours",
        nextAvailable: computeNextAvailable(
          schedule.openMinutes, schedule.closeMinutes, schedule.occupiedBlocks, dateStr, serviceDurationMinutes
        ),
      };
    }

    // Overlaps an existing booking
    const isOverlapping = schedule.occupiedBlocks.some(block => {
      return Math.max(requestedMins, block.start) < Math.min(requestedMins + serviceDurationMinutes, block.end);
    });
    if (isOverlapping) {
      return {
        available: false,
        reason: "booked",
        nextAvailable: computeNextAvailable(
          schedule.openMinutes, schedule.closeMinutes, schedule.occupiedBlocks, dateStr, serviceDurationMinutes
        ),
      };
    }

    return { available: true, reason: null, nextAvailable: null };
  } catch (error) {
    console.error("Failed to check custom time:", error);
    // Fail open — don't block the user on a server error
    return { available: true, reason: null, nextAvailable: null };
  }
}
