import Link from "next/link";
import { Scissors, CalendarCheck, TrendingUp, Users, Clock } from "lucide-react";
import { getShopDashboardStats } from "@/app/actions/shop";
import { getShopBookings } from "@/app/actions/bookings";
import { TodaysSchedule } from "@/components/TodaysSchedule";

export default async function ShopDashboard() {
  const data = await getShopDashboardStats();
  const allBookings = await getShopBookings();
  
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysBookings = allBookings.filter((b: any) => 
      b.slotDate === todayStr && 
      (b.status === "confirmed" || b.status === "pending")
  );
  
  const stats = [
    { label: "Total Bookings", value: data?.totalBookings || "0", icon: CalendarCheck, color: "bg-blue-500", href: "/shop/bookings" },
    { label: "Active Services", value: data?.activeServices || "0", icon: Scissors, color: "bg-indigo-500", href: "/shop/services" },
    { label: "Total Clients", value: data?.totalClients || "0", icon: Users, color: "bg-purple-500", href: "/shop/bookings" },
    { label: "Revenue (All time)", value: `$${(data?.revenue || 0).toFixed(2)}`, icon: TrendingUp, color: "bg-green-500", href: "/shop/dashboard" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Link href={stat.href} key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:border-indigo-300 transition-colors group cursor-pointer">
              <div className={`p-4 rounded-lg text-white ${stat.color} group-hover:scale-105 transition-transform`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <h3 className="text-2xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{stat.value}</h3>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col max-h-[400px]">
          <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Today's Schedule</h2>
              <span className="text-sm font-medium bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">{todaysBookings.length} Upcoming</span>
          </div>
          
          <TodaysSchedule initialBookings={todaysBookings} />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/shop/services" className="p-4 border border-gray-200 rounded-lg text-left hover:bg-gray-50 hover:border-indigo-300 transition-colors flex items-center justify-between group">
              <span className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">Add New Service</span>
              <span className="text-gray-400 group-hover:text-indigo-600 transition-colors">&rarr;</span>
            </Link>
            
            <Link href="/shop/bookings" className="p-4 border border-gray-200 rounded-lg text-left hover:bg-gray-50 hover:border-indigo-300 transition-colors flex items-center justify-between group">
              <span className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">View All Bookings</span>
              <span className="text-gray-400 group-hover:text-indigo-600 transition-colors">&rarr;</span>
            </Link>
            
            <Link href="/shop/settings" className="p-4 border border-gray-200 rounded-lg text-left hover:bg-gray-50 hover:border-indigo-300 transition-colors flex items-center justify-between group">
              <span className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">Update Shop Profile</span>
              <span className="text-gray-400 group-hover:text-indigo-600 transition-colors">&rarr;</span>
            </Link>
            
            <Link href="/shop/services" className="p-4 border border-gray-200 rounded-lg text-left hover:bg-gray-50 hover:border-indigo-300 transition-colors flex items-center justify-between group">
              <span className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">Manage Schedule</span>
              <span className="text-gray-400 group-hover:text-indigo-600 transition-colors">&rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
