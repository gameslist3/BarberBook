import { Store, Users, CalendarCheck, TrendingUp } from "lucide-react";
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
    { label: "Total Shops", value: totalShops.toString(), icon: Store, color: "bg-blue-500" },
    { label: "Total Users", value: totalUsers.toString(), icon: Users, color: "bg-green-500" },
    { label: "Total Bookings", value: totalBookings.toString(), icon: CalendarCheck, color: "bg-purple-500" },
    { label: "Revenue (Est)", value: `$${revenue}`, icon: TrendingUp, color: "bg-orange-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className={`p-4 rounded-lg text-white ${stat.color}`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
        <div className="text-center py-12 text-gray-500">
          No recent activity to display.
        </div>
      </div>
    </div>
  );
}
