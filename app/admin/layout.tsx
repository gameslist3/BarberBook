"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Store, Users, Calendar, History, LogOut, Bell, Menu, X, User, Shield } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { signOut as firebaseSignOut } from "firebase/auth";
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore";
import { useState, useEffect, useRef } from "react";
import { TopNavigation } from "@/components/TopNavigation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import Image from "next/image";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationList, setNotificationList] = useState<{ message: string; time: string }[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Listen for recent bookings for admin notifications
  useEffect(() => {
    const q = query(
      collection(db, "bookings"),
      orderBy("createdAt", "desc"),
      limit(10)
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => d.data());
        const notifs = items.map((b: any) => ({
          message: `New booking${b.status ? ` (${b.status})` : ""} at ${b.slotStartTime || "-"}`,
          time: b.slotDate || "-",
        }));
        setNotificationList(notifs);
      },
      (err) => {
        console.warn("Failed to load admin notifications:", err.message);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await firebaseSignOut(auth);
    await fetch('/api/auth/session', { method: 'DELETE' });
    router.push("/signin");
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const navItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Shop Accounts", href: "/admin/shops", icon: Store },
    { name: "All Users", href: "/admin/users", icon: Users },
    { name: "All Bookings", href: "/admin/bookings", icon: Calendar },
    { name: "History", href: "/admin/history", icon: History },
  ];

  const currentPageName = navItems.find(i => i.href === pathname)?.name || "Admin Portal";

  return (
    <div className="flex h-[100dvh] bg-gray-50 overflow-hidden w-full relative">
      {/* ========== MOBILE LAYOUT ========== */}
      <div className="flex flex-col h-full w-full md:hidden">
        {/* Mobile Top Header */}
        <header className="shrink-0 bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-1.5 -ml-1.5 rounded-lg text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              {showMobileMenu ? <X size={22} /> : <Menu size={22} />}
            </button>
            <h1 className="text-[17px] font-semibold text-gray-900">{currentPageName}</h1>
          </div>
          <div className="flex items-center gap-0.5">
            <LanguageSwitcher />
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors"
              >
                <Bell size={20} className="animate-icon-hover" />
                {notificationList.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-11 w-[300px] bg-white rounded-xl shadow-2xl border border-gray-200 z-[100] overflow-hidden" style={{ animation: 'slideUpFade 0.25s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
                    <div className="flex items-center gap-2">
                      {notificationList.length > 0 && (
                        <button
                          onClick={() => setNotificationList([])}
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                        >
                          Clear all
                        </button>
                      )}
                      <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notificationList.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell size={28} className="mx-auto text-gray-200 mb-2" />
                        <p className="text-sm text-gray-500">No notifications yet.</p>
                      </div>
                    ) : (
                      notificationList.map((n, i) => (
                        <div key={i} className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <p className="text-sm text-gray-800 font-medium">{n.message}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm hover:bg-indigo-200 active:bg-indigo-300 transition-colors"
              >
                <User size={16} />
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 top-11 w-52 bg-white rounded-xl shadow-2xl border border-gray-200 z-[100] overflow-hidden animate-fadeIn">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <p className="text-sm font-bold text-gray-900 truncate">Admin</p>
                    <p className="text-xs text-gray-600 truncate">App Owner</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Shield size={16} className="text-gray-500" />
                      <span className="font-medium">Admin Dashboard</span>
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

        {/* Mobile Slide-out Menu */}
        {showMobileMenu && (
          <div className="fixed inset-0 z-20" onClick={() => setShowMobileMenu(false)}>
            <div className="absolute inset-0 bg-black/40" />
            <div
              className="absolute left-0 top-14 bottom-0 w-64 bg-white shadow-2xl animate-slideInLeft"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <Image
                    src="/logo.png"
                    alt="BarberBook"
                    width={36}
                    height={36}
                    className="notranslate rounded-lg shrink-0"
                  />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Admin Portal</p>
                    <p className="text-xs text-gray-600">App Owner</p>
                  </div>
                </div>
              </div>
              <nav className="p-3 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setShowMobileMenu(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                        isActive
                          ? "bg-indigo-50 text-indigo-700 font-semibold"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <div
                        className={`p-1.5 rounded-lg ${
                          isActive ? "bg-indigo-100 text-indigo-600" : "text-gray-500"
                        }`}
                      >
                        <Icon size={20} className="animate-icon-hover" />
                      </div>
                      <span className="text-sm">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-100">
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    handleSignOut();
                  }}
                  className="flex items-center gap-3 px-3 py-3 w-full text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <LogOut size={20} className="text-red-400" />
                  <span className="font-medium">Log Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 pb-16">
          <div className="px-4 py-4">{children}</div>
        </main>

        {/* Mobile Bottom Tab Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-around h-16">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex flex-col items-center justify-center w-full h-full space-y-0.5 relative ${
                    isActive ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {isActive && (
                    <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-indigo-500 rounded-full" />
                  )}
                  <Icon size={22} className={`animate-icon-hover ${isActive ? "fill-indigo-50" : ""}`} />
                  <span className="text-[10px] font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* ========== DESKTOP LAYOUT ========== */}
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-white flex-col shrink-0">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
          <Image
            src="/logo.png"
            alt="BarberBook"
            width={28}
            height={28}
            className="notranslate rounded-lg shrink-0"
          />
          <span className="font-bold text-lg tracking-tight">Admin</span>
        </div>
        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-indigo-600 text-white" 
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon size={18} className="animate-icon-hover" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Desktop Main Content */}
      <main className="hidden md:flex flex-1 flex-col min-h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-xl font-semibold text-gray-800">{currentPageName}</h1>
          <TopNavigation serverRole="ADMIN" />
        </header>
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
