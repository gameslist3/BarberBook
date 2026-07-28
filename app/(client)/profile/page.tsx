import { getServerUser } from "@/lib/get-server-user";
import { redirect } from "next/navigation";
import { User, Mail, Calendar, Settings, Shield } from "lucide-react";
import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";

export default async function ProfilePage() {
  const user = await getServerUser();
  if (!user) {
    redirect("/signin");
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 lg:py-12 pb-24 w-full">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Profile</h1>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="p-6 md:p-8 flex items-center gap-4 border-b border-gray-100">
          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl shrink-0">
            {user.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user.name || "User"}</h2>
            <p className="text-gray-500 flex items-center gap-1 mt-1 text-sm"><Mail size={14} /> {user.email}</p>
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
              Role: {user.role}
            </span>
          </div>
        </div>
        
        <div className="p-2">
          <Link href="/shop/bookings" className="flex items-center gap-3 p-4 hover:bg-gray-50 rounded-xl transition-colors">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Calendar size={18} /></div>
            <div className="flex-1 font-medium text-gray-900 text-sm">My Bookings</div>
          </Link>
          
          {user.role === 'SHOP_OWNER' && (
            <Link href="/shop/dashboard" className="flex items-center gap-3 p-4 hover:bg-gray-50 rounded-xl transition-colors">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Settings size={18} /></div>
              <div className="flex-1 font-medium text-gray-900 text-sm">Shop Dashboard</div>
            </Link>
          )}

          {(user.role === 'ADMIN' || user.role === 'APP_OWNER') && (
            <Link href="/admin/dashboard" className="flex items-center gap-3 p-4 hover:bg-gray-50 rounded-xl transition-colors">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Shield size={18} /></div>
              <div className="flex-1 font-medium text-gray-900 text-sm">Admin Panel</div>
            </Link>
          )}
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
        <div className="p-2">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
