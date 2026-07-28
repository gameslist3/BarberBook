import Link from "next/link";
import { Scissors, CalendarCheck, TrendingUp, Users, Clock, ArrowRight } from "lucide-react";
import { getShopDashboardStats } from "@/app/actions/shop";
import { getShopBookings } from "@/app/actions/bookings";
import { TodaysSchedule } from "@/components/TodaysSchedule";

export default async function ShopDashboard() {
  const data = await getShopDashboardStats();
  const allBookings = await getShopBookings();

  const todayStr = new Date().toISOString().split("T")[0];
  const todaysBookings = allBookings.filter(
    (b: any) => b.slotDate === todayStr && (b.status === "confirmed" || b.status === "pending")
  );

  const stats = [
    {
      label: "Total Bookings",
      value: data?.totalBookings || "0",
      icon: CalendarCheck,
      color: "bg-blue-500",
      lightColor: "bg-blue-50",
      textColor: "text-blue-600",
      href: "/shop/bookings",
    },
    {
      label: "Active Services",
      value: data?.activeServices || "0",
      icon: Scissors,
      color: "bg-indigo-500",
      lightColor: "bg-indigo-50",
      textColor: "text-indigo-600",
      href: "/shop/services",
    },
    {
      label: "Total Clients",
      value: data?.totalClients || "0",
      icon: Users,
      color: "bg-purple-500",
      lightColor: "bg-purple-50",
      textColor: "text-purple-600",
      href: "/shop/bookings",
    },
    {
      label: "Revenue (All time)",
      value: `$${(data?.revenue || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: "bg-green-500",
      lightColor: "bg-green-50",
      textColor: "text-green-600",
      href: "/shop/dashboard",
    },
  ];

  return (
    <div className="space-y-5 pb-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Link
              href={stat.href}
              key={i}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3 active:scale-[0.98] transition-transform hover:border-indigo-200 group"
            >
              <div className={`p-2.5 rounded-xl ${stat.lightColor} ${stat.textColor} shrink-0`}>
                <Icon size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors mt-0.5">
                  {stat.value}
                </h3>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-indigo-500" />
            <h2 className="text-[15px] font-bold text-gray-900">Today's Schedule</h2>
          </div>
          <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">
            {todaysBookings.length} Upcoming
          </span>
        </div>
        <div className="max-h-[280px] overflow-y-auto">
          <TodaysSchedule initialBookings={todaysBookings} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h2 className="text-[15px] font-bold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-2.5">
          <Link
            href="/shop/services"
            className="p-3.5 border border-gray-200 rounded-xl text-left active:bg-gray-50 hover:border-indigo-300 transition-all flex flex-col items-start justify-between min-h-[72px]"
          >
            <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold mb-2">
              +
            </span>
            <span className="text-sm font-medium text-gray-900">Add Service</span>
          </Link>

          <Link
            href="/shop/bookings"
            className="p-3.5 border border-gray-200 rounded-xl text-left active:bg-gray-50 hover:border-indigo-300 transition-all flex flex-col items-start justify-between min-h-[72px]"
          >
            <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold mb-2">
              <CalendarCheck size={14} />
            </span>
            <span className="text-sm font-medium text-gray-900">View Bookings</span>
          </Link>

          <Link
            href="/shop/settings"
            className="p-3.5 border border-gray-200 rounded-xl text-left active:bg-gray-50 hover:border-indigo-300 transition-all flex flex-col items-start justify-between min-h-[72px]"
          >
            <span className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-xs font-bold mb-2">
              <Users size={14} />
            </span>
            <span className="text-sm font-medium text-gray-900">Edit Profile</span>
          </Link>

          <Link
            href="/shop/services"
            className="p-3.5 border border-gray-200 rounded-xl text-left active:bg-gray-50 hover:border-indigo-300 transition-all flex flex-col items-start justify-between min-h-[72px]"
          >
            <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xs font-bold mb-2">
              <Clock size={14} />
            </span>
            <span className="text-sm font-medium text-gray-900">Manage Hours</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
