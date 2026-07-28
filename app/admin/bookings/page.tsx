import { adminDb } from "@/lib/firebase-admin";
import { getServerUser } from "@/lib/get-server-user";
import { redirect } from "next/navigation";
import { Calendar, MapPin, Clock, Store, User } from "lucide-react";

export default async function AdminBookingsPage() {
  const user = await getServerUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "APP_OWNER")) {
    redirect("/");
  }

  const bookingsSnapshot = await adminDb.collection("bookings").orderBy("createdAt", "desc").get();
  
  const bookings = await Promise.all(bookingsSnapshot.docs.map(async (doc: any) => {
      const data = doc.data();
      
      const [userDoc, shopDoc, serviceDoc] = await Promise.all([
          adminDb.collection("users").doc(data.userId).get(),
          adminDb.collection("shops").doc(data.shopId).get(),
          adminDb.collection("services").doc(data.serviceId).get()
      ]);
      
      const userData = userDoc.data() || {};
      const shopData = shopDoc.data() || {};
      const serviceData = serviceDoc.data() || {};

      return {
          id: doc.id,
          ...data,
          user: { 
              id: data.userId, 
              ...userData,
              createdAt: userData.createdAt?.toDate?.()?.toISOString() || userData.createdAt,
              updatedAt: userData.updatedAt?.toDate?.()?.toISOString() || userData.updatedAt || null
          },
          shop: { 
              id: data.shopId, 
              ...shopData,
              createdAt: shopData.createdAt?.toDate?.()?.toISOString() || shopData.createdAt,
              updatedAt: shopData.updatedAt?.toDate?.()?.toISOString() || shopData.updatedAt || null
          },
          service: { 
              id: data.serviceId, 
              ...serviceData,
              createdAt: serviceData.createdAt?.toDate?.()?.toISOString() || serviceData.createdAt,
              updatedAt: serviceData.updatedAt?.toDate?.()?.toISOString() || serviceData.updatedAt || null
          },
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || null
      };
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">All Bookings</h1>
        <p className="text-gray-500 mt-1">Global view of all appointments across all shops.</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Shop & Service</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bookings.map((b: any) => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{b.slotDate}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock size={12} /> {b.slotStartTime}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900 flex items-center gap-1">
                        <Store size={14} className="text-indigo-600" /> {b.shop?.shopName || 'Unknown Shop'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {b.service?.name || 'Unknown Service'} (${Number(b.service?.price || 0).toFixed(2)})
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900 flex items-center gap-1">
                        <User size={14} className="text-blue-600" /> {b.user?.name || 'Unknown Client'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {b.user?.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        b.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        b.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        b.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                        {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {bookings.length === 0 && (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <Calendar size={32} className="mb-2 text-gray-300" />
            <p>No bookings found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
