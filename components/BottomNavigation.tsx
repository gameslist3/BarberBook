"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, User, Store } from "lucide-react";

export function BottomNavigation({ userRole }: { userRole?: string }) {
  const pathname = usePathname();

  // Hide bottom nav on booking and shop detail pages
  if (pathname.startsWith("/book/") || pathname.startsWith("/shop/")) return null;

  const mainItems = [
    { name: "Explore", href: "/explore", icon: Map },
    { name: "Profile", href: "/profile", icon: User },
  ];

  if (userRole === "SHOP_OWNER") {
    mainItems.push({ name: "Shop", href: "/shop/dashboard", icon: Store });
  } else if (userRole === "ADMIN" || userRole === "APP_OWNER") {
    mainItems.push({ name: "Admin", href: "/admin/dashboard", icon: Store });
  }

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 md:hidden animate-slideUpFade">
      <div className="bg-white rounded-full px-5 py-2.5 shadow-[0_4px_16px_rgba(0,0,0,0.1)] border border-gray-200 flex items-center gap-2">
        {mainItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ease-out hover-lift ${
                isActive
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-200 scale-105"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-50 active:scale-95"
              }`}
              style={{ animation: `popIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) ${0.1 + idx * 0.08}s both` }}
            >
              <Icon size={24} className="animate-icon-hover" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
