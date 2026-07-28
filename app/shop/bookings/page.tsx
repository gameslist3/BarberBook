"use client";

import { useState, useEffect } from "react";
import { Check, X, Clock, Loader2 } from "lucide-react";
import { getShopBookings, updateBookingStatus } from "@/app/actions/bookings";

export default function ShopBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchBookings = async () => {
    setIsLoading(true);
    const data = await getShopBookings();
    setBookings(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    if (!window.confirm(`Are you sure you want to mark this booking as ${status}?`)) return;
    const result = await updateBookingStatus(id, status);
    if (result.success) {
      fetchBookings();
    } else {
      alert("Failed to update status: " + result.error);
    }
  };

  const filteredBookings = bookings.filter(b => statusFilter === "all" ? true : b.status === statusFilter)
    .sort((a, b) => {
        // Priority: confirmed > pending > completed > cancelled
        const priority: any = { confirmed: 1, pending: 2, completed: 3, cancelled: 4 };
        if (priority[a.status] !== priority[b.status]) {
            return (priority[a.status] || 99) - (priority[b.status] || 99);
        }
        return 0; // fallback to original sort by date
    });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-gray-500">Manage your upcoming client appointments.</p>
        
        <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md text-sm text-gray-700 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
            <option value="all">All Bookings</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Client Name</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Service</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Date & Time</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Manage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
               <tr><td colSpan={5} className="px-6 py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400"/></td></tr>
            ) : filteredBookings.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No upcoming bookings. Check back later!
                </td>
              </tr>
            ) : (
              filteredBookings.map(booking => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{booking.user?.name || "Unknown User"}</td>
                  <td className="px-6 py-4 text-gray-700">
                      {booking.services && booking.services.length > 0 
                          ? booking.services.map((s: any) => s.name).join(", ") 
                          : booking.service?.name || "Unknown Service"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-900 font-medium">{booking.slotDate}</div>
                    <div className="text-gray-500 text-sm flex items-center gap-1"><Clock size={14}/> {booking.slotStartTime}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                      ${booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' : 
                        booking.status === 'completed' ? 'bg-green-100 text-green-800' : 
                        'bg-red-100 text-red-800'}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {booking.status === 'confirmed' ? (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleUpdateStatus(booking.id, 'completed')} className="p-2 text-green-600 hover:bg-green-50 rounded-lg border border-transparent hover:border-green-200" title="Mark Completed"><Check size={18}/></button>
                        <button onClick={() => handleUpdateStatus(booking.id, 'cancelled')} className="p-2 text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200" title="Cancel Booking"><X size={18}/></button>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Locked</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
