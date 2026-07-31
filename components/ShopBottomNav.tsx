"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Scissors, CalendarCheck, Settings, History } from "lucide-react";
import { useLanguage } from "./LanguageContext";

interface ShopBottomNavProps {
  newBookingCount?: number;
}

export function ShopBottomNav({ newBookingCount = 0 }: ShopBottomNavProps) {
  const pathname = usePathname();
  const { translate } = useLanguage();

  const navItems = [
    { name: translate("dashboard"), href: "/shop/dashboard", icon: LayoutDashboard },
    { name: translate("services"), href: "/shop/services", icon: Scissors },
    { name: translate("bookings"), href: "/shop/bookings", icon: CalendarCheck, badge: newBookingCount },
    { name: translate("history"), href: "/shop/history", icon: History },
    { name: translate("settings"), href: "/shop/settings", icon: Settings },
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-slideUpFade">
      <div className="bg-white/90 backdrop-blur-xl rounded-full px-4 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-gray-100/80 flex items-center gap-1 transition-all duration-300">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ease-out hover-lift ${
                isActive
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-200 scale-105"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-50 active:scale-95"
              }`}
              style={{ animation: `popIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) ${0.1 + idx * 0.08}s both` }}
            >
              <Icon size={22} className="animate-icon-hover" />
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center shadow-sm animate-popIn">
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
