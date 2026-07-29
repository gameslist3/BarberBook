"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Scissors, CalendarCheck, Settings } from "lucide-react";

interface ShopBottomNavProps {
  newBookingCount?: number;
}

export function ShopBottomNav({ newBookingCount = 0 }: ShopBottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/shop/dashboard", icon: LayoutDashboard },
    { name: "Services", href: "/shop/services", icon: Scissors },
    { name: "Bookings", href: "/shop/bookings", icon: CalendarCheck, badge: newBookingCount },
    { name: "Settings", href: "/shop/settings", icon: Settings },
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      <div className="bg-white/90 backdrop-blur-xl rounded-full px-4 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-gray-100/80 flex items-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 ${
                isActive
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-200 scale-105"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-50 active:scale-95"
              }`}
            >
              <Icon size={20} />
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center shadow-sm">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
