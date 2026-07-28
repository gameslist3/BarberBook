"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Scissors, CalendarCheck, Settings, LogOut } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { TopNavigation } from "@/components/TopNavigation";
import { useState, useEffect } from "react";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [toasts, setToasts] = useState<{id: string, message: string, type: 'info'|'warning'|'success'}[]>([]);
  const [shopData, setShopData] = useState<any>(null);

  const addToast = (message: string, type: 'info'|'warning'|'success' = 'info') => {
      const id = Math.random().toString(36).substring(7);
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
      }, 5000);
  };

  useEffect(() => {
      const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
          if (user) {
              // Fetch shop
              const q = query(collection(db, "shops"), where("ownerId", "==", user.uid));
              const snap = await getDocs(q);
              if (!snap.empty) {
                  const shop = { id: snap.docs[0].id, ...snap.docs[0].data() };
                  setShopData(shop);
                  
                  // Listen for new bookings
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
                              // Only alert if it's a recent booking
                              if (b.status === "confirmed") {
                                  addToast(`New Booking Received for ${b.slotStartTime}!`, 'success');
                              }
                          }
                      });
                  });
                  
                  return () => unsubscribeBookings();
              }
          }
      });
      return () => unsubscribeAuth();
  }, []);
  
  // Lunch time monitor
  useEffect(() => {
      if (!shopData?.lunchTime) return;
      
      const interval = setInterval(() => {
          const now = new Date();
          const lunchParts = shopData.lunchTime.split(':');
          const lunchDate = new Date();
          lunchDate.setHours(parseInt(lunchParts[0]), parseInt(lunchParts[1]), 0);
          
          const diffMins = (lunchDate.getTime() - now.getTime()) / (1000 * 60);
          
          // Alert exactly when it hits 15 mins
          if (diffMins > 14 && diffMins <= 15) {
              addToast(`Lunch time starts in 15 minutes!`, 'warning');
          }
      }, 60000); // check every minute
      
      return () => clearInterval(interval);
  }, [shopData?.lunchTime]);

  const handleSignOut = async () => {
    await firebaseSignOut(auth);
    await fetch('/api/auth/session', { method: 'DELETE' });
    router.push("/signin");
  };

  const navItems = [
    { name: "Dashboard", href: "/shop/dashboard", icon: LayoutDashboard },
    { name: "My Services", href: "/shop/services", icon: Scissors },
    { name: "Bookings", href: "/shop/bookings", icon: CalendarCheck },
    { name: "Settings", href: "/shop/settings", icon: Settings },
  ];

  return (
    <div className="flex h-[100dvh] bg-gray-50 overflow-hidden w-full">
      {/* Sidebar */}
      <aside className="w-16 lg:w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 font-bold text-xl tracking-tight border-b border-slate-800">
          <span className="hidden lg:block">Barber Portal</span>
          <span className="block lg:hidden">BP</span>
        </div>
        <nav className="flex-1 py-6 px-2 lg:px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                title={item.name}
              >
                <Icon size={20} className="shrink-0" />
                <span className="font-medium hidden lg:block">{item.name}</span>
              </Link>
            )
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

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 flex flex-col relative">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-xl font-semibold text-gray-800">
            {navItems.find(i => i.href === pathname)?.name || "Barber Portal"}
          </h1>
          <TopNavigation serverRole="SHOP_OWNER" />
        </header>
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
      
      {/* Toast Manager */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
          {toasts.map(toast => (
              <div key={toast.id} className={`px-6 py-4 rounded-xl shadow-lg border text-sm font-medium animate-in slide-in-from-right-5 fade-in duration-300 flex items-center gap-3 min-w-[300px]
                  ${toast.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 
                    toast.type === 'warning' ? 'bg-orange-50 text-orange-800 border-orange-200' : 
                    'bg-blue-50 text-blue-800 border-blue-200'}`}
              >
                  {toast.message}
              </div>
          ))}
      </div>
    </div>
  );
}

