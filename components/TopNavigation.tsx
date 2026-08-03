"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Bell, Settings, User, Trash2, Store, CreditCard, Shield, LogOut } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { signOut as firebaseSignOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { collection, query, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "./LanguageContext";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useBookingNotifications, type NotifItem } from "./useBookingNotifications";
import { NotificationsPanel } from "./NotificationsPanel";

interface TopNavigationProps {
  serverRole?: string;
}

export function TopNavigation({ serverRole }: TopNavigationProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { translate } = useLanguage();

  // Live notifications — only new booking events (confirmed / cancelled),
  // newest first, dismissed notifications stay dismissed after "Clear all".
  // Memoized so the snapshot listener doesn't re-subscribe on every render.
  const bookingsQuery = useMemo(
    () =>
      user
        ? query(collection(db, "bookings"), where("userId", "==", user.uid))
        : null,
    [user]
  );
  const { notifications, clearAll } = useBookingNotifications(
    bookingsQuery,
    (b: any, changeType, docId) => {
      if (b.status === "cancelled" || b.status === "no_show") {
        return {
          id: `${docId}:cancelled`,
          title: translate("bookingCancelled") || "Booking Cancelled",
          message: `Your booking on ${b.slotDate} at ${b.slotStartTime} was cancelled.`,
          time: `${b.slotDate || ""} • ${b.slotStartTime || ""}`,
          type: "danger",
        } as NotifItem;
      }
      if (changeType === "added" && b.status === "confirmed") {
        return {
          id: `${docId}:confirmed`,
          title: translate("bookingConfirmed") || "Booking Confirmed",
          message: `You have an appointment on ${b.slotDate} at ${b.slotStartTime}.`,
          time: `${b.slotDate || ""} • ${b.slotStartTime || ""}`,
          type: "success",
        } as NotifItem;
      }
      return null;
    },
    `bb_client_notifs_${user?.uid || "anon"}`
  );

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
        <LanguageSwitcher />
        <Link href="/signin" className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-all duration-200 hover:-translate-y-0.5">{translate("signIn")}</Link>
        <Link href="/signup" className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97]">Sign Up</Link>
      </nav>
    );
  }

  // Build settings menu items based on role
  const settingsItems: { label: string; icon: any; onClick?: () => void; href?: string; danger?: boolean; divider?: boolean }[] = [];

  // Everyone can edit their personal profile. Shop owners get both their own
  // "Profile Info" entry (client area) and "Shop Info" (shop area).
  settingsItems.push({ label: "Profile Info", icon: User, href: "/profile" });

  if (serverRole === "SHOP_OWNER") {
    settingsItems.push({ label: "Shop Info", icon: Store, href: "/shop/settings" });
  }

  if (serverRole === "ADMIN" || serverRole === "APP_OWNER") {
    settingsItems.push({ label: "Admin Panel", icon: Shield, href: "/admin/dashboard" });
  }


  // Just a divider before destructive actions
  settingsItems.push({ label: "", icon: CreditCard, divider: true, href: "" });

  if (serverRole !== "SHOP_OWNER" && serverRole !== "ADMIN" && serverRole !== "APP_OWNER") {
    settingsItems.push({ label: "Delete Account", icon: Trash2, onClick: handleDeleteAccount, danger: true });
  }

  settingsItems.push({ label: "Log Out", icon: LogOut, onClick: handleSignOut, danger: false });

  return (
    <nav className="flex items-center gap-1 sm:gap-2">
      <LanguageSwitcher />
      {/* Welcome text */}
      <span className="text-sm text-gray-500 hidden md:inline-block mr-2 max-w-[160px] truncate">
        {user.displayName || user.email?.split('@')[0]}
      </span>

      {/* Notifications */}
      <div className="relative z-50" ref={notifRef}>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowNotifications(!showNotifications); setShowSettings(false); }}
          className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-all duration-200 hover:scale-105 active:scale-95"
          title="Notifications"
        >
          <Bell size={20} className={`animate-icon-hover ${showNotifications ? 'animate-ringBell' : ''}`} />
          {notifications.length > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-popIn"></span>
          )}
        </button>

        {showNotifications && (
          <div className="absolute right-0 top-12">
            <NotificationsPanel
              notifications={notifications}
              onClearAll={clearAll}
              onClose={() => setShowNotifications(false)}
              accent="violet"
            />
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="relative z-50" ref={settingsRef}>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowSettings(!showSettings); setShowNotifications(false); }}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-all duration-200 hover:scale-105 active:scale-95"
          title="Settings"
        >
          <Settings size={20} className="animate-icon-spin-hover" />
        </button>

        {showSettings && (
          <div className="absolute right-0 top-12 w-[280px] sm:w-56 bg-white rounded-xl shadow-2xl border border-gray-200 z-[999] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200" style={{ animation: 'slideUpFade 0.25s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <p className="text-sm font-bold text-gray-900 truncate">{user.displayName || user.email?.split('@')[0]}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            <div className="py-1">
              {settingsItems.map((item, i) => {
                const Icon = item.icon;
                const baseClasses = `flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm transition-all duration-200 hover:pl-5 ${
                  item.danger 
                    ? 'text-red-600 hover:bg-red-50/80' 
                    : 'text-gray-700 hover:bg-gray-50/80'
                }`;

                const content = (
                  <>
                    <Icon size={16} className={`animate-icon-hover ${item.danger ? 'text-red-400' : 'text-gray-400'}`} />
                    <span className="font-medium">{item.label}</span>
                  </>
                );

                return (
                  <div key={i} style={{ animation: `fadeInUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.04}s both` }}>
                    {item.divider && <div className="border-t border-gray-100 my-1"></div>}
                    {item.label && (
                      item.href ? (
                        <Link href={item.href} className={`${baseClasses} group`} onClick={() => setShowSettings(false)}>
                          {content}
                        </Link>
                      ) : (
                        <button className={`${baseClasses} group`} onClick={() => { setShowSettings(false); item.onClick?.(); }}>
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
