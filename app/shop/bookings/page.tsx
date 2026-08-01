"use client";

import { useState, useEffect } from "react";
import { Clock, Calendar, ChevronDown, Filter, Loader2, User, Scissors, Phone, ArrowUpDown, ArrowDownUp, ListOrdered } from "lucide-react";
import { SkeletonBookingCard } from "@/components/Skeleton";
import { getShopBookings } from "@/app/actions/bookings";
import { timeToMinutes } from "@/lib/timeUtils";
import { UserAvatar } from "@/components/UserAvatar";

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  all: { label: "All Bookings", color: "text-gray-700", bg: "bg-gray-100", dot: "bg-gray-400" },
  booked: { label: "Booked", color: "text-blue-700", bg: "bg-blue-50", dot: "bg-blue-500" },
  completed: { label: "Completed", color: "text-violet-700", bg: "bg-violet-50", dot: "bg-violet-500" },
  cancelled: { label: "Cancelled", color: "text-red-700", bg: "bg-red-50", dot: "bg-red-500" },
  pending: { label: "Pending", color: "text-amber-700", bg: "bg-amber-50", dot: "bg-amber-500" },
};

const SORT_OPTIONS: { key: string; label: string; icon: any }[] = [
  { key: "newest", label: "Newest first", icon: ArrowDownUp },
  { key: "oldest", label: "Oldest first", icon: ArrowUpDown },
  { key: "status", label: "By status", icon: ListOrdered },
];

export default function ShopBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [showSortDropdown, setShowSortDropdown] = useState(false);

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
    .filter((b) => {
      if (statusFilter === "all") return true;
      if (statusFilter === "booked") return b.status === "confirmed" || b.status === "pending";
      return b.status === statusFilter;
    })
    .sort((a, b) => {
      // Compare by (slotDate, slotStartTime) numerically so 12-hour times
      // like "9:00 AM" vs "10:30 AM" sort correctly.
      const cmp = (x: any, y: any) => {
        const dateDiff = (x.slotDate || "").localeCompare(y.slotDate || "");
        if (dateDiff !== 0) return dateDiff;
        return timeToMinutes(x.slotStartTime) - timeToMinutes(y.slotStartTime);
      };
      if (sortBy === "newest") return cmp(b, a);
      if (sortBy === "oldest") return cmp(a, b);
      const priority: any = { confirmed: 1, pending: 2, completed: 3, cancelled: 4 };
      return (priority[a.status] || 99) - (priority[b.status] || 99);
    });

  const getStatusBadge = (status: string) => {
    const key = status === "confirmed" ? "booked" : status;
    const config = statusConfig[key] || statusConfig.all;
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
      {/* Section Header with Filter + Sort */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[17px] font-bold text-gray-900">Bookings</h2>
        <div className="flex items-center gap-2">
          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:border-violet-200 active:bg-gray-50 transition-all shadow-sm"
            >
              {(() => {
                const Icon = SORT_OPTIONS.find((s) => s.key === sortBy)?.icon || ArrowDownUp;
                return <Icon size={14} className="text-gray-400" />;
              })()}
              <span>{SORT_OPTIONS.find((s) => s.key === sortBy)?.label}</span>
              <ChevronDown
                size={14}
                className={`text-gray-400 transition-transform ${showSortDropdown ? "rotate-180" : ""}`}
              />
            </button>
            {showSortDropdown && (
              <div className="absolute right-0 top-12 w-44 bg-white rounded-2xl shadow-xl border border-gray-200 z-20 overflow-hidden animate-fadeIn">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => {
                      setSortBy(opt.key);
                      setShowSortDropdown(false);
                    }}
                    className={`flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      sortBy === opt.key
                        ? "bg-violet-50 text-violet-700 font-semibold"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <opt.icon size={14} className="text-gray-400 shrink-0" />
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
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
              {Object.entries(statusConfig)
                .filter(([key]) => key !== "pending")
                .map(([key, config]) => {
                const filterKey = key === "booked" ? "booked" : key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setStatusFilter(filterKey);
                      setShowFilterDropdown(false);
                    }}
                    className={`flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      statusFilter === filterKey
                        ? "bg-violet-50 text-violet-700 font-semibold"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${config.dot} shrink-0`} />
                    {config.label}
                  </button>
                );
              })}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <SkeletonBookingCard key={i} />)}
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
                      <UserAvatar
                        user={booking.user}
                        className="w-10 h-10 rounded-full ring-2 ring-white shadow-sm"
                        fallbackClassName="bg-violet-100 text-violet-700 font-bold text-sm"
                      />
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
                    {/* Call icon — only for active (booked) schedules with a phone number */}
                    {(booking.status === "confirmed" || booking.status === "pending") &&
                      booking.user?.phone && (
                        <a
                          href={`tel:${booking.user.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="ml-auto w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200 hover:text-emerald-700 active:scale-90 transition-all flex items-center justify-center shrink-0"
                          title={`Call ${booking.user.name || "client"} at ${booking.user.phone}`}
                        >
                          <Phone size={15} />
                        </a>
                      )}
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
