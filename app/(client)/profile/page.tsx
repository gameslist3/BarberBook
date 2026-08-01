import { getServerUser } from "@/lib/get-server-user";
import { redirect } from "next/navigation";
import { Shield } from "lucide-react";
import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { UserProfileEditor } from "@/components/UserProfileEditor";

export default async function ProfilePage() {
  const user = await getServerUser();
  if (!user) {
    redirect("/signin");
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 lg:py-12 pb-24 w-full">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Profile</h1>

      {/* Shared editor: photo, name, locked email + phone — works for every role */}
      <UserProfileEditor />

      {(user.role === 'ADMIN' || user.role === 'APP_OWNER') && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-6">
          <div className="p-2">
            <Link href="/admin/dashboard" className="flex items-center gap-3 p-4 hover:bg-gray-50 rounded-xl transition-colors">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Shield size={18} /></div>
              <div className="flex-1 font-medium text-gray-900 text-sm">Admin Panel</div>
            </Link>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden mt-6">
        <div className="p-2">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
