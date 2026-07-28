import { Store, Users, CalendarCheck, TrendingUp, Activity } from "lucide-react";
import { getAdminDashboardStats } from "@/app/actions/admin";
import { getServerUser } from "@/lib/get-server-user";
import { redirect } from "next/navigation";

export default async function AdminDashboard() {
  const user = await getServerUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "APP_OWNER")) {
    redirect("/");
  }

  const { totalShops, totalUsers, totalBookings, revenue } = await getAdminDashboardStats();

  const stats = [
    {
      label: "Total Shops",
      value: totalShops.toString(),
      icon: Store,
      color: "bg-blue-500",
      lightColor: "bg-blue-50",
      textColor: "text-blue-600",
      href: "/admin/shops",
    },
    {
      label: "Total Users",
      value: totalUsers.toString(),
      icon: Users,
      color: "bg-green-500",
      lightColor: "bg-green-50",
      textColor: "text-green-600",
      href: "/admin/users",
    },
    {
      label: "Total Bookings",
      value: totalBookings.toString(),
      icon: CalendarCheck,
      color: "bg-purple-500",
      lightColor: "bg-purple-50",
      textColor: "text-purple-600",
      href: "/admin/bookings",
    },
    {
      label: "Revenue (Est)",
      value: `$${revenue}`,
      icon: TrendingUp,
      color: "bg-orange-500",
      lightColor: "bg-orange-50",
      textColor: "text-orange-600",
      href: "/admin/dashboard",
    },
  ];

  return (
    <div className="space-y-5 pb-6">
      {/* Stats Grid - Mobile responsive 2 cols, 4 cols on desktop */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3 active:scale-[0.98] transition-transform"
            >
              <div className={`p-2.5 rounded-xl ${stat.lightColor} ${stat.textColor} shrink-0`}>
                <Icon size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-xl font-bold text-gray-900 mt-0.5">{stat.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity - Mobile responsive */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3.5 border-b border-gray-100">
          <Activity size={18} className="text-indigo-500" />
          <h2 className="text-[15px] font-bold text-gray-900">Recent Activity</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <Activity size={32} className="text-gray-200 mb-3" />
          <p className="text-sm font-medium">No recent activity to display.</p>
          <p className="text-xs text-gray-400 mt-1">Activity will appear here as the platform grows.</p>
        </div>
      </div>
    </div>
  );
}
