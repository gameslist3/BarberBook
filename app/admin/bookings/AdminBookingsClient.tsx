"use client";

import { useState } from "react";
import { Calendar, Clock, Store, User, ChevronDown, Filter, MapPin } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  all: { label: "All", color: "text-gray-700", bg: "bg-gray-100", dot: "bg-gray-400" },
  booked: { label: "Booked", color: "text-blue-700", bg: "bg-blue-50", dot: "bg-blue-500" },
  completed: { label: "Completed", color: "text-green-700", bg: "bg-green-50", dot: "bg-green-500" },
  cancelled: { label: "Cancelled", color: "text-red-700", bg: "bg-red-50", dot: "bg-red-500" },
  pending: { label: "Pending", color: "text-amber-700", bg: "bg-amber-50", dot: "bg-amber-500" },
};

const getFilterKey = (status: string) => (status === "confirmed" ? "booked" : status);

export default function AdminBookingsClient({ bookings }: { bookings: any[] }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "booked") return b.status === "confirmed" || b.status === "pending";
    return b.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    const config = statusConfig[getFilterKey(status)] || statusConfig.all;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.color}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        {config.label}
      </span>
    );
  };

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-gray-500">Global view of all appointments across all shops.</p>
        </div>

        {/* Filter Pills - Desktop */}
        <div className="hidden md:flex items-center gap-2">
          {Object.entries(statusConfig).map(([key, config]) => {
            const filterKey = getFilterKey(key);
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(filterKey)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === filterKey
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {config.label}
              </button>
            );
          })}
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
              {Object.entries(statusConfig).map(([key, config]) => {
                const filterKey = getFilterKey(key);
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setStatusFilter(filterKey);
                      setShowFilterDropdown(false);
                    }}
                    className={`flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      statusFilter === filterKey ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                    {config.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <Calendar size={28} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No bookings found</h3>
          <p className="text-sm text-gray-500">No bookings match the selected filter.</p>
        </div>
      ) : (
        <>
          {/* Mobile: Card List */}
          <div className="md:hidden space-y-3">
            {filteredBookings.map((b: any) => (
              <div
                key={b.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden active:scale-[0.99] transition-transform"
              >
                <div className="p-4">
                  {/* Header Row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar
                        user={b.user}
                        className="w-9 h-9 rounded-full"
                        fallbackClassName="bg-indigo-50 text-indigo-600 font-semibold text-sm"
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{b.user?.name || "Unknown Client"}</p>
                        <p className="text-xs text-gray-500">{b.user?.email || ""}</p>
                      </div>
                    </div>
                    {getStatusBadge(b.status)}
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Store size={13} className="text-indigo-400 shrink-0" />
                      <span className="notranslate font-medium text-gray-700">{b.shop?.shopName || "Unknown Shop"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User size={13} className="text-blue-400 shrink-0" />
                      <span>{b.service?.name || "Unknown Service"} (₹{Number(b.service?.price || 0).toFixed(2)})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={13} className="text-gray-400 shrink-0" />
                      <span>{b.slotDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={13} className="text-gray-400 shrink-0" />
                      <span>{b.slotStartTime}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Table */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                  {filteredBookings.map((b: any) => (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{b.slotDate}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock size={12} /> {b.slotStartTime}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900 flex items-center gap-1">
                            <Store size={14} className="text-indigo-600" /> <span className="notranslate">{b.shop?.shopName || 'Unknown Shop'}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {b.service?.name || 'Unknown Service'} (₹{Number(b.service?.price || 0).toFixed(2)})
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar
                            user={b.user}
                            className="w-9 h-9 rounded-full"
                            fallbackClassName="bg-indigo-50 text-indigo-600 font-semibold text-sm"
                          />
                          <div>
                            <div className="font-semibold text-gray-900">{b.user?.name || 'Unknown Client'}</div>
                            <div className="text-sm text-gray-500">
                              {b.user?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(b.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
