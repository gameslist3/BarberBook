"use client";

import { useState, useEffect } from "react";
import { Check, X, Clock, Loader2, Calendar, User, Scissors, ChevronDown, Filter } from "lucide-react";
import { getShopBookings, updateBookingStatus } from "@/app/actions/bookings";
import { getScheduleInfo } from "@/lib/timeUtils";

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  all: { label: "All", color: "text-gray-700", bg: "bg-gray-100", dot: "bg-gray-400" },
  confirmed: { label: "Confirmed", color: "text-blue-700", bg: "bg-blue-50", dot: "bg-blue-500" },
  completed: { label: "Completed", color: "text-green-700", bg: "bg-green-50", dot: "bg-green-500" },
  cancelled: { label: "Cancelled", color: "text-red-700", bg: "bg-red-50", dot: "bg-red-500" },
  pending: { label: "Pending", color: "text-amber-700", bg: "bg-amber-50", dot: "bg-amber-500" },
};

export default function ShopBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

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

  const filteredBookings = bookings
    .filter((b) => (statusFilter === "all" ? true : b.status === statusFilter))
    .sort((a, b) => {
      const priority: any = { confirmed: 1, pending: 2, completed: 3, cancelled: 4 };
      if (priority[a.status] !== priority[b.status]) {
        return (priority[a.status] || 99) - (priority[b.status] || 99);
      }
      return 0;
    });

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || statusConfig.all;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.color}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        {config.label}
      </span>
    );
  };

  return (
    <div className="pb-6">
      {/* Header with Filter */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">Manage your client appointments.</p>

        {/* Filter Dropdown - Desktop */}
        <div className="hidden md:flex items-center gap-2">
          {Object.keys(statusConfig).map((key) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === key
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {statusConfig[key].label}
            </button>
          ))}
        </div>

        {/* Filter Dropdown - Mobile */}
        <div className="relative md:hidden">
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-700 active:bg-gray-50 transition-colors"
          >
            <Filter size={15} />
            {statusConfig[statusFilter].label}
            <ChevronDown size={14} />
          </button>
          {showFilterDropdown && (
            <div className="absolute right-0 top-10 w-40 bg-white rounded-xl shadow-xl border border-gray-200 z-20 overflow-hidden animate-fadeIn">
              {Object.entries(statusConfig).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => {
                    setStatusFilter(key);
                    setShowFilterDropdown(false);
                  }}
                  className={`flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    statusFilter === key ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                  {config.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <p className="text-sm text-gray-400">Loading bookings...</p>
          </div>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <Calendar size={28} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No bookings yet</h3>
          <p className="text-sm text-gray-500">When clients book your services, they&apos;ll appear here.</p>
        </div>
      ) : (
        <>
          {/* Mobile: Card List */}
          <div className="md:hidden space-y-3">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden active:scale-[0.99] transition-transform"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-semibold text-sm shrink-0">
                        {(booking.user?.name || "U").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{booking.user?.name || "Unknown User"}</p>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                          <Scissors size={12} />
                          <span>
                            {booking.services && booking.services.length > 0
                              ? booking.services.map((s: any) => s.name).join(", ")
                              : booking.service?.name || "Unknown Service"}
                          </span>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} />
                      <span>{booking.slotDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} />
                      <span>{booking.slotStartTime}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {booking.status === "confirmed" && (() => {
                    const { hasStarted } = getScheduleInfo(booking.slotDate, booking.slotStartTime);
                    return (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleUpdateStatus(booking.id, "completed")}
                        disabled={!hasStarted}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-green-50 text-green-700 text-sm font-medium hover:bg-green-100 active:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Check size={16} />
                        Complete
                      </button>
                      {!hasStarted && (
                        <button
                          onClick={() => handleUpdateStatus(booking.id, "cancelled")}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100 active:bg-red-200 transition-colors"
                        >
                          <X size={16} />
                          Cancel
                        </button>
                      )}
                    </div>
                  )})()}
                  {booking.status !== "confirmed" && (
                    <div className="mt-3 py-2.5 text-center text-xs text-gray-400 bg-gray-50 rounded-lg">
                      {booking.status === "completed" ? "✓ Completed" : "✗ Cancelled"}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Table */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{booking.user?.name || "Unknown User"}</td>
                    <td className="px-6 py-4 text-gray-700">
                      {booking.services && booking.services.length > 0
                        ? booking.services.map((s: any) => s.name).join(", ")
                        : booking.service?.name || "Unknown Service"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 font-medium">{booking.slotDate}</div>
                      <div className="text-gray-500 text-sm flex items-center gap-1">
                        <Clock size={14} /> {booking.slotStartTime}
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(booking.status)}</td>
                    <td className="px-6 py-4 text-right">
                      {booking.status === "confirmed" ? (() => {
                        const { hasStarted } = getScheduleInfo(booking.slotDate, booking.slotStartTime);
                        return (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleUpdateStatus(booking.id, "completed")}
                            disabled={!hasStarted}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg border border-transparent hover:border-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Mark Completed"
                          >
                            <Check size={18} />
                          </button>
                          {!hasStarted && (
                            <button
                              onClick={() => handleUpdateStatus(booking.id, "cancelled")}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition-colors"
                              title="Cancel Booking"
                            >
                              <X size={18} />
                            </button>
                          )}
                        </div>
                      )})() : (
                        <span className="text-sm text-gray-400">Locked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
