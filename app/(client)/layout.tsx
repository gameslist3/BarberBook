import Link from "next/link";
import { Scissors } from "lucide-react";
import { TopNavigation } from "@/components/TopNavigation";
import { BottomNavigation } from "@/components/BottomNavigation";
import { getServerUser } from "@/lib/get-server-user";
import { adminDb } from "@/lib/firebase-admin";
import { ClientNotificationProvider } from "@/components/ClientNotificationProvider";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser();

  // Check if user has multiple roles (both CLIENT and SHOP_OWNER accounts)
  let hasMultipleRoles = false;
  if (user) {
    try {
      const usersSnapshot = await adminDb.collection("users").where("email", "==", user.email).get();
      const roles = usersSnapshot.docs.map(d => d.data().role);
      hasMultipleRoles = new Set(roles).size > 1;
    } catch (_) {}
  }

  return (
    <div className="bg-gray-50 h-[100dvh] flex flex-col overflow-hidden w-full relative pb-16 md:pb-0">
      <ClientNotificationProvider />
      <header className="bg-white border-b border-gray-200 shrink-0 z-50 relative hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-indigo-600">
            <Scissors size={24} />
            <span className="font-bold text-xl tracking-tight text-gray-900 hidden sm:block">BarberBook</span>
          </Link>
          
          <TopNavigation serverRole={user?.role} hasMultipleRoles={hasMultipleRoles} />
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto relative flex flex-col">
        {children}
      </main>

      <BottomNavigation userRole={user?.role} />
    </div>
  );
}

