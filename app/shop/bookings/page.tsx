"use client";

import { useState, useEffect } from "react";
import { Clock, Calendar, ChevronDown, Filter, Loader2, User, Scissors } from "lucide-react";
import { getShopBookings } from "@/app/actions/bookings";

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  all: { label: "All Bookings", color: "text-gray-700", bg: "bg-gray-100", dot: "bg-gray-400" },
  confirmed: { label: "Confirmed", color: "text-blue-700", bg: "bg-blue-50", dot: "bg-blue-500" },
  completed: { label: "Completed", color: "text-violet-700", bg: "bg-violet-50", dot: "bg-violet-500" },
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
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold ${config.bg} ${config.color}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Section Header with Filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-[17px] font-bold text-gray-900">Bookings</h2>
        {/* Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:border-violet-200 active:bg-gray-50 transition-all shadow-sm"
          >
            <Filter size={14} className="text-gray-400" />
            <span>{statusConfig[statusFilter].label}</span>
            <ChevronDown
              size={14}
              className={`text-gray-400 transition-transform ${showFilterDropdown ? "rotate-180" : ""}`}
            />
          </button>
          {showFilterDropdown && (
            <div className="absolute right-0 top-12 w-44 bg-white rounded-2xl shadow-xl border border-gray-200 z-20 overflow-hidden animate-fadeIn">
              {Object.entries(statusConfig).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => {
                    setStatusFilter(key);
                    setShowFilterDropdown(false);
                  }}
                  className={`flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    statusFilter === key
                      ? "bg-violet-50 text-violet-700 font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${config.dot} shrink-0`} />
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
            <Loader2 className="w-7 h-7 animate-spin text-violet-500" />
            <p className="text-sm text-gray-400">Loading bookings...</p>
          </div>
        </div>
      ) : filteredBookings.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-violet-50 flex items-center justify-center mx-auto mb-4">
            <Calendar size={28} className="text-violet-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No bookings found</h3>
          <p className="text-sm text-gray-500">
            {statusFilter === "all"
              ? "When clients book your services, they'll appear here."
              : `No bookings with status "${statusConfig[statusFilter].label}".`}
          </p>
        </div>
      ) : (
        /* Booking Cards */
        <div className="space-y-3">
          {filteredBookings.map((booking) => {
            const servicesCount =
              booking.services && booking.services.length > 0
                ? booking.services.length
                : booking.service ? 1 : 0;

            return (
              <div
                key={booking.id}
                className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-50 overflow-hidden active:scale-[0.99] transition-transform"
              >
                <div className="p-4">
                  {/* Top: Avatar + Name + Status */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm shrink-0 ring-2 ring-white shadow-sm">
                        {(booking.user?.name || "U").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[15px] font-bold text-gray-900">
                          {booking.user?.name || "Unknown Client"}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                          <Scissors size={12} className="text-gray-400" />
                          <span className="font-semibold text-gray-700">{servicesCount}</span>
                          <span>service{servicesCount !== 1 ? "s" : ""}</span>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>

                  {/* Date & Time Row */}
                  <div className="flex items-center gap-4 bg-gray-50 rounded-xl px-3.5 py-2.5">
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Calendar size={13} className="text-gray-400" />
                      <span className="font-medium">{booking.slotDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Clock size={13} className="text-gray-400" />
                      <span className="font-medium">{booking.slotStartTime}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
