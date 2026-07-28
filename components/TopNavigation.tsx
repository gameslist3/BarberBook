"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Settings, X, User, Trash2, Store, CreditCard, Shield, LogOut, ArrowLeftRight } from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut as firebaseSignOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface TopNavigationProps {
  serverRole?: string;
  hasMultipleRoles?: boolean;
}

export function TopNavigation({ serverRole, hasMultipleRoles }: TopNavigationProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = async () => {
    await firebaseSignOut(auth);
    await fetch('/api/auth/session', { method: 'DELETE' });
    window.location.href = '/';
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;
    try {
      const res = await fetch('/api/auth/delete-account', { method: 'DELETE' });
      if (!res.ok) throw new Error("Failed to delete account");
      await firebaseSignOut(auth);
      await fetch('/api/auth/session', { method: 'DELETE' });
      window.location.href = '/';
    } catch (e) {
      alert("Error deleting account. Please try again.");
    }
  };

  if (!user) {
    return (
      <nav className="flex items-center gap-3">
        <Link href="/signin" className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">Sign In</Link>
        <Link href="/signup" className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">Sign Up</Link>
      </nav>
    );
  }

  // Build settings menu items based on role
  const settingsItems: { label: string; icon: any; onClick?: () => void; href?: string; danger?: boolean; divider?: boolean }[] = [];

  settingsItems.push({ label: "Profile Info", icon: User, href: "/profile" });

  if (hasMultipleRoles) {
    settingsItems.push({ label: "Switch Profile", icon: ArrowLeftRight, href: "/select-profile" });
  }

  if (serverRole === "SHOP_OWNER") {
    settingsItems.push({ label: "Shop Info", icon: Store, href: "/shop/settings" });
  }

  if (serverRole === "ADMIN" || serverRole === "APP_OWNER") {
    settingsItems.push({ label: "Admin Panel", icon: Shield, href: "/admin/dashboard" });
  }

  if (serverRole === "SHOP_OWNER" || serverRole === "ADMIN") {
    settingsItems.push({ label: "Recharge Info", icon: CreditCard, href: "#", divider: true });
  } else {
    // Just a divider for normal users
    settingsItems.push({ label: "", icon: CreditCard, divider: true, href: "" });
  }

  if (serverRole !== "SHOP_OWNER" && serverRole !== "ADMIN" && serverRole !== "APP_OWNER") {
    settingsItems.push({ label: "Delete Account", icon: Trash2, onClick: handleDeleteAccount, danger: true });
  }

  settingsItems.push({ label: "Log Out", icon: LogOut, onClick: handleSignOut, danger: false });

  return (
    <nav className="flex items-center gap-1 sm:gap-2">
      {/* Welcome text */}
      <span className="text-sm text-gray-500 hidden md:inline-block mr-2 max-w-[160px] truncate">
        {user.displayName || user.email?.split('@')[0]}
      </span>

      {/* Notifications */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => { setShowNotifications(!showNotifications); setShowSettings(false); }}
          className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
          title="Notifications"
        >
          <Bell size={20} />
          {notifications.length > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          )}
        </button>

        {showNotifications && (
          <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
              <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell size={28} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-sm text-gray-500">No notifications yet.</p>
                  <p className="text-xs text-gray-400 mt-1">We'll let you know when something happens.</p>
                </div>
              ) : (
                notifications.map((n: any, i: number) => (
                  <div key={i} className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
                    <p className="text-sm text-gray-800 font-medium">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="relative" ref={settingsRef}>
        <button
          onClick={() => { setShowSettings(!showSettings); setShowNotifications(false); }}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
          title="Settings"
        >
          <Settings size={20} />
        </button>

        {showSettings && (
          <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <p className="text-sm font-bold text-gray-900 truncate">{user.displayName || user.email?.split('@')[0]}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            <div className="py-1">
              {settingsItems.map((item, i) => {
                const Icon = item.icon;
                const baseClasses = `flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  item.danger 
                    ? 'text-red-600 hover:bg-red-50' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`;

                const content = (
                  <>
                    <Icon size={16} className={item.danger ? 'text-red-400' : 'text-gray-400'} />
                    <span className="font-medium">{item.label}</span>
                  </>
                );

                return (
                  <div key={i}>
                    {item.divider && <div className="border-t border-gray-100 my-1"></div>}
                    {item.label && (
                      item.href ? (
                        <Link href={item.href} className={baseClasses} onClick={() => setShowSettings(false)}>
                          {content}
                        </Link>
                      ) : (
                        <button className={baseClasses} onClick={() => { setShowSettings(false); item.onClick?.(); }}>
                          {content}
                        </button>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
