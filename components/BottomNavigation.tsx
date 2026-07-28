"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, User, Settings } from "lucide-react";

export function BottomNavigation({ userRole }: { userRole?: string }) {
  const pathname = usePathname();

  const mainItems = [
    { name: "Explore", href: "/explore", icon: Map },
    { name: "Profile", href: "/profile", icon: User },
  ];

  if (userRole === "SHOP_OWNER") {
    mainItems.push({ name: "Shop", href: "/shop/dashboard", icon: Settings });
  } else if (userRole === "ADMIN" || userRole === "APP_OWNER") {
    mainItems.push({ name: "Admin", href: "/admin/dashboard", icon: Settings });
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-[100] pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-16">
        {mainItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? "text-indigo-600" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Icon size={20} className={isActive ? "fill-indigo-50" : ""} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
