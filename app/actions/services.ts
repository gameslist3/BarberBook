"use server";

import { adminDb } from "@/lib/firebase-admin";
import { getServerUser } from "@/lib/get-server-user";
import { revalidatePath } from "next/cache";

// Helper to get the shop record for the currently logged-in user
async function getShopForCurrentUser() {
  const user = await getServerUser();
  if (!user) throw new Error("Unauthorized");
  
  const shopsSnapshot = await adminDb.collection("shops").where("ownerId", "==", user.id).limit(1).get();
  if (shopsSnapshot.empty) throw new Error("No shop profile found for this account.");
  
  return { ...shopsSnapshot.docs[0].data(), id: shopsSnapshot.docs[0].id };
}

export async function getServices() {
  try {
    const shop = await getShopForCurrentUser();
    const servicesSnapshot = await adminDb.collection("services")
        .where("shopId", "==", shop.id)
        .get();
        
    const services = servicesSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    services.sort((a, b) => a.name.localeCompare(b.name));
    return services;
  } catch (error) {
    console.error("Error fetching services:", error);
    return [];
  }
}

export async function addService(data: { name: string; price: number; duration: number; isActive: boolean }) {
  try {
    const shop = await getShopForCurrentUser();
    const serviceRef = adminDb.collection("services").doc();
    const serviceData = {
        name: data.name,
        price: data.price,
        duration: data.duration,
        isActive: data.isActive,
        shopId: shop.id
    };
    await serviceRef.set(serviceData);
    
    revalidatePath("/shop/services");
    return { success: true, service: { id: serviceRef.id, ...serviceData } };
  } catch (error: any) {
    console.error("Error adding service:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteService(serviceId: string) {
  try {
    const user = await getServerUser();
    if (!user || user.role !== "SHOP_OWNER") throw new Error("Unauthorized");
    
    await adminDb.collection("services").doc(serviceId).delete();
    revalidatePath("/shop/services");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleServiceStatus(serviceId: string, isActive: boolean) {
  try {
    const user = await getServerUser();
    if (!user || user.role !== "SHOP_OWNER") throw new Error("Unauthorized");
    
    await adminDb.collection("services").doc(serviceId).update({ isActive });
    revalidatePath("/shop/services");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


export async function editService(serviceId: string, data: { name: string; price: number; duration: number }) {
  try {
    const user = await getServerUser();
    if (!user || user.role !== "SHOP_OWNER") throw new Error("Unauthorized");
    
    await adminDb.collection("services").doc(serviceId).update({
        name: data.name,
        price: data.price,
        duration: data.duration
    });
    
    revalidatePath("/shop/services");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
