import Link from "next/link";
import Image from "next/image";
import { TopNavigation } from "@/components/TopNavigation";
import { BottomNavigation } from "@/components/BottomNavigation";
import { getServerUser } from "@/lib/get-server-user";
import { ClientNotificationProvider } from "@/components/ClientNotificationProvider";
import { SessionGuard } from "@/components/SessionGuard";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser();

  // Shop owners may also use the client area (explore, profile, booking) —
  // the select-profile screen offers both entry points.
  return (
    <div className="bg-gray-50 h-[100dvh] flex flex-col overflow-hidden w-full relative">
      <ClientNotificationProvider />
      <SessionGuard />
      
      {/* Desktop Header */}
      <header className="bg-white border-b border-gray-200 shrink-0 z-50 relative hidden md:block animate-fadeIn">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 text-violet-600 group">
            <Image
              src="/logo.png"
              alt="BarberBook"
              width={32}
              height={32}
              className="notranslate rounded-lg transition-transform duration-300 group-hover:scale-105 group-hover:shadow-md"
            />
            <span className="notranslate font-bold text-xl tracking-tight text-gray-900 hidden sm:block transition-colors duration-300 group-hover:text-violet-600">BarberBook</span>
          </Link>
          
          <TopNavigation serverRole={user?.role} />
        </div>
      </header>
      
      {/* Mobile Compact Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 shrink-0 z-50 relative md:hidden animate-fadeIn" style={{ animationDuration: '0.3s' }}>
        <div className="h-14 flex items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src="/logo.png"
              alt="BarberBook"
              width={28}
              height={28}
              className="notranslate rounded-lg shrink-0 transition-transform duration-300 group-hover:scale-105"
            />
            <span className="notranslate text-base font-bold text-gray-900 tracking-tight transition-colors duration-300 group-hover:text-violet-600">BarberBook</span>
          </Link>
          <TopNavigation serverRole={user?.role} />
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto relative flex flex-col">
        {children}
      </main>

      <BottomNavigation userRole={user?.role} />
    </div>
  );
}
