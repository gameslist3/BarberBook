import { adminDb } from "@/lib/firebase-admin";
import { getServerUser } from "@/lib/get-server-user";
import { redirect } from "next/navigation";
import { Calendar, Clock, Store, User } from "lucide-react";
import AdminBookingsClient from "./AdminBookingsClient";

export default async function AdminBookingsPage() {
  const user = await getServerUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "APP_OWNER")) {
    redirect("/");
  }

  const bookingsSnapshot = await adminDb.collection("bookings").orderBy("createdAt", "desc").get();
  
  const bookings = await Promise.all(bookingsSnapshot.docs.map(async (doc: any) => {
      const data = doc.data();
      
      const [userDoc, shopDoc, serviceDoc] = await Promise.all([
          data.userId ? adminDb.collection("users").doc(data.userId).get() : Promise.resolve(null),
          data.shopId ? adminDb.collection("shops").doc(data.shopId).get() : Promise.resolve(null),
          data.serviceId ? adminDb.collection("services").doc(data.serviceId).get() : Promise.resolve(null)
      ]);
      
      const userData = userDoc?.exists ? userDoc.data() : null;
      const shopData = shopDoc?.exists ? shopDoc.data() : null;
      const serviceData = serviceDoc?.exists ? serviceDoc.data() : null;

      return {
          id: doc.id,
          ...data,
          user: { 
              id: data.userId, 
              ...(userData || {}),
              createdAt: userData?.createdAt?.toDate?.()?.toISOString() || userData?.createdAt || null,
              updatedAt: userData?.updatedAt?.toDate?.()?.toISOString() || userData?.updatedAt || null
          },
          shop: { 
              id: data.shopId, 
              ...(shopData || {}),
              createdAt: shopData?.createdAt?.toDate?.()?.toISOString() || shopData?.createdAt || null,
              updatedAt: shopData?.updatedAt?.toDate?.()?.toISOString() || shopData?.updatedAt || null,
              accessExpiresAt: shopData?.accessExpiresAt?.toDate?.()?.toISOString() || shopData?.accessExpiresAt || null
          },
          service: { 
              id: data.serviceId, 
              ...(serviceData || {}),
              createdAt: serviceData?.createdAt?.toDate?.()?.toISOString() || serviceData?.createdAt || null,
              updatedAt: serviceData?.updatedAt?.toDate?.()?.toISOString() || serviceData?.updatedAt || null
          },
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || null,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || null
      };
  }));

  return <AdminBookingsClient bookings={bookings} />;
}
