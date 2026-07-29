"use server";

import { adminDb } from "@/lib/firebase-admin";
import { getServerUser } from "@/lib/get-server-user";

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

export async function createBooking(data: { shopId: string, serviceIds: string[], time: string }) {
  const user = await getServerUser();
  
  if (!user) {
    return { success: false, error: "You must be signed in to book an appointment." };
  }
  
  try {
    const bookingRef = adminDb.collection("bookings").doc();
    const todayStr = new Date().toISOString().split('T')[0];
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

    const today = new Date().toISOString().split("T")[0];
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

export async function getAvailableSlots(shopId: string, dateStr: string, serviceDurationMinutes: number) {
  try {
    const shopDoc = await adminDb.collection("shops").doc(shopId).get();
    if (!shopDoc.exists) return [];
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
    const servicesMap: Record<string, number> = {};
    
    if (serviceIds.length > 0) {
      // Chunk queries in case there are more than 10 unique services
      for (let i = 0; i < serviceIds.length; i += 10) {
        const chunk = serviceIds.slice(i, i + 10);
        const servicesSnapshot = await adminDb.collection("services").where("__name__", "in", chunk).get();
        servicesSnapshot.docs.forEach(doc => {
           servicesMap[doc.id] = parseInt(doc.data().duration, 10) || 30;
        });
      }
    }
    
    // Build a list of occupied blocks [startMinutes, endMinutes]
    const occupiedBlocks: { start: number, end: number }[] = [];
    bookingsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const startMins = parseTimeToMinutes(data.slotStartTime);
      const bookingServiceIds: string[] = data.serviceIds || (data.serviceId ? [data.serviceId] : []);
      const duration = bookingServiceIds.reduce((total, id) => total + (servicesMap[id] || 30), 0) || 30;
      occupiedBlocks.push({ start: startMins, end: startMins + duration });
    });
    
    // Generate slots every 30 minutes
    const slots: string[] = [];
    
    // Check if the requested date is today to filter out past slots
    const today = new Date();
    // Assuming dateStr is "YYYY-MM-DD"
    const isToday = dateStr === today.toISOString().split('T')[0];
    const currentMinutes = today.getHours() * 60 + today.getMinutes();
    
    for (let currentSlotMins = openMinutes; currentSlotMins + serviceDurationMinutes <= closeMinutes; currentSlotMins += 30) {
      // Filter out past times if it's today
      if (isToday && currentSlotMins <= currentMinutes) {
        continue;
      }
      
      const slotEndMins = currentSlotMins + serviceDurationMinutes;
      
      // Check for overlap with any occupied block
      const isOverlapping = occupiedBlocks.some(block => {
        // Overlap condition:
        // Math: Two intervals [A, B] and [C, D] overlap if max(A, C) < min(B, D)
        return Math.max(currentSlotMins, block.start) < Math.min(slotEndMins, block.end);
      });
      
      if (!isOverlapping) {
        slots.push(formatMinutesToTime(currentSlotMins));
      }
    }
    
    return slots;
    
  } catch (error) {
    console.error("Failed to generate slots:", error);
    return [];
  }
}
