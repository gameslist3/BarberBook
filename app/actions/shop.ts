"use server";

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";

export async function createShop(formData: any) {
  const { name, owner, email, password, phone, expiryDays, openTime, closeTime } = formData;
  
  try {
    // 1. Create the user using Firebase Admin Auth
    const userRecord = await adminAuth.createUser({
      email: email,
      password: password,
      displayName: owner,
    });
    
    const userId = userRecord.uid;
    
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);
    
    const batch = adminDb.batch();
    
    // 2. Create the User document
    const userRef = adminDb.collection("users").doc(userId);
    batch.set(userRef, {
        name: owner,
        // Store lowercase so multi-role detection (query by canonical auth
        // email) finds every profile linked to the same email.
        email: (email || "").trim().toLowerCase(),
        role: "SHOP_OWNER",
        createdAt: new Date(),
    });
    
    // 3. Create the Shop record
    const shopRef = adminDb.collection("shops").doc();
    batch.set(shopRef, {
        id: shopRef.id,
        shopName: name,
        phone: phone,
        ownerId: userId,
        isActive: true,
        openTime: openTime || "9:00 AM",
        closeTime: closeTime || "6:00 PM",
        accessExpiresAt: expiryDate,
        createdAt: new Date(),
    });
    
    await batch.commit();
    
    revalidatePath("/admin/shops");
    return { success: true, shop: { id: shopRef.id, shopName: name } };
  } catch (error: any) {
    console.error("Error creating shop:", error);
    return { success: false, error: error.message };
  }
}

export async function getShops() {
  try {
    const shopsSnapshot = await adminDb.collection("shops").orderBy("createdAt", "desc").get();
    
    const shops = await Promise.all(shopsSnapshot.docs.map(async (doc: any) => {
        const shopData = doc.data();
        
        // Fetch owner details
        const ownerDoc = await adminDb.collection("users").doc(shopData.ownerId).get();
        const ownerData = ownerDoc.data() || {};
        
        return {
            ...shopData,
            id: doc.id,
            owner: {
                id: shopData.ownerId,
                name: ownerData.name,
                email: ownerData.email,
            },
            // Firebase timestamps need to be serialized for client components
            accessExpiresAt: shopData.accessExpiresAt?.toDate?.()?.toISOString() || shopData.accessExpiresAt,
            createdAt: shopData.createdAt?.toDate?.()?.toISOString() || shopData.createdAt,
            updatedAt: shopData.updatedAt?.toDate?.()?.toISOString() || shopData.updatedAt || null,
        };
    }));
    
    return shops;
  } catch (error) {
    console.error("Error fetching shops:", error);
    return [];
  }
}

export async function deleteShop(shopId: string) {
  try {
    const shopDoc = await adminDb.collection("shops").doc(shopId).get();
    if (shopDoc.exists) {
        const shopData = shopDoc.data();
        if (shopData?.ownerId) {
            // Delete Auth user
            await adminAuth.deleteUser(shopData.ownerId).catch(() => {});
            // Delete user doc
            await adminDb.collection("users").doc(shopData.ownerId).delete();
        }
        
        // Delete shop doc
        await shopDoc.ref.delete();
        
        // Ideally we would delete subcollections/related docs (services, bookings) too,
        // but for this MVP, deleting the shop is fine.
    }
    
    revalidatePath("/admin/shops");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting shop:", error);
    return { success: false, error: error.message };
  }
}

export async function toggleShopStatus(shopId: string, currentStatus: boolean) {
  try {
    await adminDb.collection("shops").doc(shopId).update({
        isActive: !currentStatus
    });
    
    revalidatePath("/admin/shops");
    return { success: true };
  } catch (error: any) {
    console.error("Error toggling shop status:", error);
    return { success: false, error: error.message };
  }
}

import { getServerUser } from "@/lib/get-server-user";

export async function getShopDashboardStats() {
  try {
    const user = await getServerUser();
    if (!user) return null;
    
    const shopsSnapshot = await adminDb.collection("shops").where("ownerId", "==", user.id).limit(1).get();
    if (shopsSnapshot.empty) return null;
    
    const shopId = shopsSnapshot.docs[0].id;
    
    // Fetch bookings and services in parallel
    const [bookingsSnapshot, servicesSnapshot] = await Promise.all([
        adminDb.collection("bookings").where("shopId", "==", shopId).get(),
        adminDb.collection("services").where("shopId", "==", shopId).get()
    ]);
    
    const bookings = bookingsSnapshot.docs.map(doc => doc.data());
    const services = servicesSnapshot.docs.map(doc => doc.data());
    
    // Calculate total revenue (completed bookings)
    let totalRevenue = 0;
    const completedBookings = bookings.filter(b => b.status === "completed");
    
    for (const b of completedBookings) {
        const service = services.find(s => s.id === b.serviceId);
        if (service) totalRevenue += Number(service.price);
    }
    
    // Calculate unique clients
    const uniqueClients = new Set(bookings.map(b => b.userId)).size;
    
    return {
        totalBookings: bookings.length,
        activeServices: services.length,
        totalClients: uniqueClients,
        revenue: totalRevenue
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return { totalBookings: 0, activeServices: 0, totalClients: 0, revenue: 0 };
  }
}

export async function getShopProfile() {
  try {
    const user = await getServerUser();
    if (!user || user.role !== "SHOP_OWNER") return null;
    
    const shopsSnapshot = await adminDb.collection("shops").where("ownerId", "==", user.id).limit(1).get();
    if (shopsSnapshot.empty) return null;
    
    const shopData = shopsSnapshot.docs[0].data();
    return {
      id: shopsSnapshot.docs[0].id,
      shopName: shopData.shopName || "",
      address: shopData.address || "",
      phone: shopData.phone || "",
      googleMapLink: shopData.googleMapLink || "",
      description: shopData.description || "",
      logoUrl: shopData.logoUrl || "",
      images: shopData.images || [],
      lunchStartTime: shopData.lunchStartTime || shopData.lunchTime || "1:00 PM",
      lunchEndTime: shopData.lunchEndTime || "2:00 PM",
      lunchTime: shopData.lunchTime || shopData.lunchStartTime || "13:00",
      openTime: shopData.openTime || "9:00 AM",
      closeTime: shopData.closeTime || "6:00 PM",
      holidays: shopData.holidays || {},
    };
  } catch (error) {
    console.error("Error fetching shop profile:", error);
    return null;
  }
}

export async function updateShopProfile(data: { shopName: string; address: string; phone: string; description: string; googleMapLink: string; lunchTime?: string; lunchStartTime?: string; lunchEndTime?: string; openTime?: string; closeTime?: string; logoUrl?: string; images?: string[]; holidays?: Record<string, string> }) {
  try {
    const user = await getServerUser();
    if (!user || user.role !== "SHOP_OWNER") throw new Error("Unauthorized");
    
    const shopsSnapshot = await adminDb.collection("shops").where("ownerId", "==", user.id).limit(1).get();
    if (shopsSnapshot.empty) throw new Error("Shop not found");
    
    const shopId = shopsSnapshot.docs[0].id;
    
    await adminDb.collection("shops").doc(shopId).update({
      shopName: data.shopName,
      address: data.address,
      phone: data.phone,
      description: data.description,
      googleMapLink: data.googleMapLink,
      ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
      ...(data.images !== undefined && { images: data.images }),
      ...(data.lunchStartTime !== undefined && { lunchStartTime: data.lunchStartTime }),
      ...(data.lunchEndTime !== undefined && { lunchEndTime: data.lunchEndTime }),
      ...(data.lunchTime !== undefined && { lunchTime: data.lunchTime }),
      ...(data.openTime !== undefined && { openTime: data.openTime }),
      ...(data.closeTime !== undefined && { closeTime: data.closeTime }),
      ...(data.holidays !== undefined && { holidays: data.holidays }),
      updatedAt: new Date()
    });
    
    revalidatePath("/shop/settings");
    revalidatePath("/explore");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating shop profile:", error);
    return { success: false, error: error.message };
  }
}
