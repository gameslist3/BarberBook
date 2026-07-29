"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Scissors, CalendarCheck, Settings, LogOut, Bell, User, Store } from "lucide-react";
import { TopNavigation } from "@/components/TopNavigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ShopStatCards } from "@/components/ShopStatCards";
import { ShopBottomNav } from "@/components/ShopBottomNav";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Reset new booking badge when visiting Bookings page
  useEffect(() => {
    if (pathname === "/shop/bookings") {
      setNewBookingCount(0);
    }
  }, [pathname]);

  const [toasts, setToasts] = useState<{ id: string; message: string; type: "info" | "warning" | "success" }[]>([]);
  const [shopData, setShopData] = useState<any>(null);
  const [shopId, setShopId] = useState<string>("");
  const [newBookingCount, setNewBookingCount] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [userEmail, setUserEmail] = useState("");

  const addToast = (message: string, type: "info" | "warning" | "success" = "info") => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserEmail(user.email || "");
        const shopQ = query(collection(db, "shops"), where("ownerId", "==", user.uid));
        const unsubscribeShop = onSnapshot(shopQ, (snap) => {
          if (!snap.empty) {
            const shop = { id: snap.docs[0].id, ...snap.docs[0].data() } as any;
            setShopData(shop);
            setShopId(shop.id);

            // Monitor bookings for new booking badge and notifications
            if (shop.isActive !== false) {
              const bookingsQ = query(collection(db, "bookings"), where("shopId", "==", shop.id));
              let isInitialRender = true;

              const unsubscribeBookings = onSnapshot(bookingsQ, (snapshot) => {
                if (isInitialRender) {
                  isInitialRender = false;
                  return;
                }
                snapshot.docChanges().forEach((change) => {
                  if (change.type === "added") {
                    const b = change.doc.data();
                    // Only count confirmed/pending as new
                    if (b.status === "confirmed" || b.status === "pending") {
                      setNewBookingCount((prev) => prev + 1);
                      if (b.status === "confirmed") {
                        addToast(`New Booking Received for ${b.slotStartTime}!`, "success");
                      }
                    }
                  }
                });
              });
              (window as any)._unsubscribeBookings = unsubscribeBookings;
            }
          }
        });
        return () => {
          unsubscribeShop();
          if ((window as any)._unsubscribeBookings) (window as any)._unsubscribeBookings();
        };
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Lunch time monitor
  useEffect(() => {
    if (!shopData?.lunchTime) return;
    const interval = setInterval(() => {
      const now = new Date();
      const lunchParts = shopData.lunchTime.split(":");
      const lunchDate = new Date();
      lunchDate.setHours(parseInt(lunchParts[0]), parseInt(lunchParts[1]), 0);
      const diffMins = (lunchDate.getTime() - now.getTime()) / (1000 * 60);
      if (diffMins > 14 && diffMins <= 15) {
        addToast("Lunch time starts in 15 minutes!", "warning");
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [shopData?.lunchTime]);

  // Close profile menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = async () => {
    await firebaseSignOut(auth);
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/signin");
  };

  const navItems = [
    { name: "Dashboard", href: "/shop/dashboard", icon: LayoutDashboard },
    { name: "My Services", href: "/shop/services", icon: Scissors },
    { name: "Bookings", href: "/shop/bookings", icon: CalendarCheck },
    { name: "Settings", href: "/shop/settings", icon: Settings },
  ];

  return (
    <div className="flex h-[100dvh] bg-gray-50 overflow-hidden w-full relative">
      {/* Deactivated Overlay */}
      {shopData?.isActive === false && (
        <div className="absolute inset-0 z-[100] bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-red-50 text-red-600 w-20 h-20 rounded-full flex items-center justify-center mb-6">
            <Settings size={40} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Access Has Been Paused</h2>
          <p className="text-gray-600 text-lg mb-8 max-w-md">
            Your shop account is currently deactivated. You cannot access your dashboard, manage services, or receive new bookings at this time.
          </p>
          <div className="bg-gray-100 p-6 rounded-xl border border-gray-200">
            <p className="text-gray-900 font-medium mb-2">To activate your account, please contact the App Owner:</p>
            <p className="text-lg font-bold text-violet-600 mb-1">📞 +1 (555) 123-4567</p>
            <p className="text-lg font-bold text-green-600">💬 WhatsApp: +1 (555) 123-4567</p>
          </div>
          <button onClick={handleSignOut} className="mt-12 text-gray-600 hover:text-gray-900 underline underline-offset-4">
            Sign out of this account
          </button>
        </div>
      )}

      {/* ========== MOBILE LAYOUT ========== */}
      <div className="flex flex-col h-full w-full md:hidden">
        {/* Premium Compact Header */}
        <header className="shrink-0 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 h-14 flex items-center justify-between z-30">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="BarberBook"
              width={28}
              height={28}
              className="rounded-lg shrink-0"
            />
            <span className="text-base font-bold text-gray-900 tracking-tight">BarberBook</span>
          </div>

          {/* Right side: Notification + Profile */}
          <div className="flex items-center gap-1">
            <button className="relative p-2 rounded-full text-gray-500 hover:bg-violet-50 hover:text-violet-600 active:bg-violet-100 transition-all">
              <Bell size={20} className="animate-icon-hover" />
            </button>
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-semibold text-sm hover:bg-violet-200 active:bg-violet-300 transition-all ring-2 ring-white shadow-sm"
              >
                <User size={16} />
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 top-11 w-52 bg-white rounded-2xl shadow-2xl border border-gray-200 z-[100] overflow-hidden animate-fadeIn">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <p className="text-sm font-bold text-gray-900 truncate">Shop Owner</p>
                    <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/shop/settings"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Store size={16} className="text-gray-500" />
                      <span className="font-medium">Shop Info</span>
                    </Link>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        handleSignOut();
                      }}
                      className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={16} className="text-red-400" />
                      <span className="font-medium">Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 pb-24">
          <div className="px-4 pt-4 pb-4">
            {/* Stat Cards - shown on every page */}
            {shopId && <ShopStatCards shopId={shopId} />}
            {children}
          </div>
        </main>

        {/* Floating Circular Bottom Navigation */}
        <ShopBottomNav newBookingCount={newBookingCount} />
      </div>

      {/* ========== DESKTOP LAYOUT ========== */}
      <aside className="hidden md:flex w-16 lg:w-64 bg-slate-900 text-white flex-col shrink-0">
        <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-800">
          <Image
            src="/logo.png"
            alt="BarberBook"
            width={32}
            height={32}
            className="rounded-lg shrink-0"
          />
          <span className="hidden lg:block ml-3 font-bold text-lg tracking-tight">Barber Portal</span>
        </div>
        <nav className="flex-1 py-6 px-2 lg:px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                  isActive ? "bg-violet-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
                title={item.name}
              >
                <Icon size={20} className="shrink-0 animate-icon-hover" />
                <span className="font-medium hidden lg:block">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-2 lg:p-4 border-t border-slate-800 shrink-0">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-3 w-full text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Log Out"
          >
            <LogOut size={20} className="shrink-0" />
            <span className="font-medium hidden lg:block">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Desktop Main Content */}
      <main className="hidden md:flex flex-1 overflow-y-auto bg-gray-50 flex-col relative">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-xl font-semibold text-gray-800">
            {navItems.find((i) => i.href === pathname)?.name || "Barber Portal"}
          </h1>
          <TopNavigation serverRole="SHOP_OWNER" />
        </header>
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto">
            {shopId && <ShopStatCards shopId={shopId} />}
            {children}
          </div>
        </div>
      </main>

      {/* Toast Manager */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-5 py-3 rounded-2xl shadow-lg border text-sm font-medium flex items-center gap-3 min-w-[280px] max-w-[360px] animate-slideInRight ${
              toast.type === "success"
                ? "bg-green-50 text-green-800 border-green-200"
                : toast.type === "warning"
                  ? "bg-orange-50 text-orange-800 border-orange-200"
                  : "bg-blue-50 text-blue-800 border-blue-200"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
