"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getAllActiveShops, getAvailableSlots } from "@/app/actions/client";
import { MapPin, Search, X, Loader2, Map, Phone, Scissors, Clock, ChevronRight, Bell } from "lucide-react";
import { SkeletonExploreList } from "@/components/Skeleton";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useLanguage } from "@/components/LanguageContext";

// ─── Helper: check if booking time hasn't passed yet ────────────
function isBookingStillActive(slotDate: string, slotStartTime: string): boolean {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  
  // Future date → still active
  if (slotDate > today) return true;
  // Past date → not active
  if (slotDate < today) return false;
  
  // Today — check if time has passed
  const match = slotStartTime?.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return true;
  
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = match[3]?.toUpperCase();
  if (ampm === "PM" && h < 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  
  const slotMins = h * 60 + m;
  const nowMins = now.getHours() * 60 + now.getMinutes();
  
  // Booking alert shows until the service start time
  return nowMins < slotMins;
}

// ─── Countdown timer hook ───────────────────────────────────────
function useCountdown(targetTime: string | null) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (!targetTime) { setText(""); return; }

    const update = () => {
      const match = targetTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) { setText(targetTime); return; }

      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const ampm = match[3].toUpperCase();
      if (ampm === "PM" && h < 12) h += 12;
      if (ampm === "AM" && h === 12) h = 0;

      const now = new Date();
      const target = new Date();
      target.setHours(h, m, 0, 0);

      const diffMs = target.getTime() - now.getTime();
      if (diffMs <= 0) { setText("Starting now!"); return; }

      const hours = Math.floor(diffMs / 3600000);
      const mins = Math.floor((diffMs % 3600000) / 60000);

      if (hours > 0) setText(`in ${hours}h ${mins}m`);
      else if (mins > 0) setText(`in ${mins}m`);
      else setText("Starting now!");
    };

    update();
    const interval = setInterval(update, 30000); // update every 30s
    return () => clearInterval(interval);
  }, [targetTime]);

  return text;
}

// ─── Upcoming booking alert ─────────────────────────────────────
function UpcomingBookingAlert({ booking }: { booking: any }) {
  const countdownText = useCountdown(booking?.slotStartTime || null);
  if (!booking) return null;

  return (
    <Link
      href={`/shop/${booking.shop?.id || ""}`}
      className="block bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-4 text-white mb-3 shadow-lg shadow-violet-200/50 active:scale-[0.99] transition-transform"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 backdrop-blur">
          <Bell size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold">Upcoming Appointment</p>
          <p className="text-xs text-white/80 mt-0.5">
            <span className="notranslate">{booking.shop?.shopName || "Barber Shop"}</span> • {booking.slotStartTime}
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <Clock size={12} className="text-white/80" />
            <span className="text-sm font-semibold">
              {countdownText || booking.slotStartTime}
            </span>
          </div>
        </div>
        <ChevronRight size={18} className="text-white/60 shrink-0 mt-1" />
      </div>
    </Link>
  );
}

function ShopCard({ shop, router, selectedShopId, setSelectedShopId }: any) {
  const { translate: tr } = useLanguage();
  const [slots, setSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSlots = async () => {
      const today = new Date().toISOString().split('T')[0];
      const available = await getAvailableSlots(shop.id, today, 30);
      setSlots(available.slice(0, 5));
      setIsLoading(false);
    };
    fetchSlots();
  }, [shop.id]);

  return (
    <div
      onClick={() => { router.push(`/shop/${shop.id}`); }}
      className={`bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-50 overflow-hidden active:scale-[0.99] transition-transform cursor-pointer ${selectedShopId === shop.id ? 'border-violet-400 shadow-md ring-1 ring-violet-100' : ''}`}
    >
      <div className="p-4">
        {/* ═══ ROW 1: Logo + Name (left) | Map + Phone (right) ═══ */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center shrink-0 overflow-hidden border border-gray-100">
              {shop.logoUrl ? (
                <img src={shop.logoUrl} alt={shop.shopName} className="notranslate w-full h-full object-cover" />
              ) : (
                <Scissors className="h-6 w-6 text-violet-500" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="notranslate text-[17px] font-bold text-gray-900 truncate">{shop.shopName}</h3>
            </div>
          </div>

          <div className="flex flex-row items-center gap-1.5 shrink-0 ml-2">
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                if (shop.googleMapLink) {
                  setSelectedShopId(shop.id);
                }
              }}
              className={`p-2 rounded-xl transition-colors flex items-center justify-center ${shop.googleMapLink ? (selectedShopId === shop.id ? 'bg-violet-600 text-white' : 'bg-violet-50 text-violet-600 hover:bg-violet-100') : 'bg-gray-50 text-gray-400 cursor-not-allowed'}`}
              disabled={!shop.googleMapLink}
              title={shop.googleMapLink ? "View on map" : "Location not set"}
            >
              <Map size={18} />
            </button>
            {shop.phone && (
              <a onClick={(e) => e.stopPropagation()} href={`tel:${shop.phone}`} className="p-2 rounded-xl bg-gray-50 text-gray-500 hover:bg-violet-50 hover:text-violet-600 transition-colors">
                <Phone size={18} />
              </a>
            )}
          </div>
        </div>

        {/* ═══ ROW 2: Address + Timing ═══ */}
        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3.5 py-2.5 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-600 min-w-0 flex-1">
            <MapPin size={15} className="text-gray-400 shrink-0" />
            <span className="line-clamp-2">{shop.address || "Local Shop"}</span>
          </div>
          <div className="shrink-0 ml-2">
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg whitespace-nowrap">
              {shop.openTime || "9:00 AM"} - {shop.closeTime || "6:00 PM"}
            </span>
          </div>
        </div>

        {/* ═══ ROW 3: Status / Action ═══ */}
        {isLoading ? (
          <div className="flex items-center justify-center py-2.5 text-xs text-gray-500 bg-gray-50 rounded-xl">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> {tr("checkingAvailability")}
          </div>
        ) : slots.length > 0 ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/book/${shop.id}`);
            }}
            className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm shadow-violet-200 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {tr("bookNow")} - Next slot at {slots[0]}
          </button>
        ) : (
          <div className="text-center py-2.5 text-xs font-semibold text-red-600 bg-red-50 rounded-xl">
            {tr("fullyBooked")}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const router = useRouter();
  const { translate } = useLanguage();
  const [allShops, setAllShops] = useState<any[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [panelHeight, setPanelHeight] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);
  const isDraggingRef = useRef(false);
  const panelHeightRef = useRef<number | null>(null);

  useEffect(() => {
    setIsMobile(window.innerWidth < 1024);
    // Map takes ~38vh, panel takes remaining space below
    setPanelHeight(window.innerHeight * 0.62);

    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Keep panelHeightRef in sync with state
  useEffect(() => {
    panelHeightRef.current = panelHeight;
  }, [panelHeight]);

  // ── Upcoming bookings — real-time Firestore listener ────
  const [upcomingBooking, setUpcomingBooking] = useState<any>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setUpcomingBooking(null);
        return;
      }

      const today = new Date().toISOString().split("T")[0];
      const bookingsQ = query(
        collection(db, "bookings"),
        where("userId", "==", user.uid),
        where("slotDate", ">=", today),
        where("status", "in", ["confirmed", "pending"])
      );

      const unsubBookings = onSnapshot(bookingsQ, async (snapshot) => {
        if (snapshot.empty) {
          setUpcomingBooking(null);
          return;
        }

        // Fetch shop names for each booking
        const shopIds = [...new Set(snapshot.docs.map((d) => d.data().shopId))];
        const shopsMap: Record<string, any> = {};
        
        // Use server action for shop data (avoids needing shops structured query)
        const allShopsData = await getAllActiveShops();
        for (const s of allShopsData) {
          shopsMap[s.id] = s;
        }

        // Build booking list sorted by date+time, only active ones
        const todayStr = new Date().toISOString().split("T")[0];
        const bookings = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            const shop = shopsMap[data.shopId];
            return {
              id: doc.id,
              ...data,
              shop: shop
                ? { shopName: shop.shopName, logoUrl: shop.logoUrl, id: shop.id }
                : null,
            } as any;
          })
          .filter((b: any) => isBookingStillActive(b.slotDate || todayStr, b.slotStartTime))
          .sort((a: any, b: any) => {
            if (a.slotDate === b.slotDate)
              return (a.slotStartTime || "").localeCompare(b.slotStartTime || "");
            return a.slotDate.localeCompare(b.slotDate);
          });

        setUpcomingBooking(bookings.length > 0 ? bookings[0] : null);
      });

      return () => unsubBookings();
    });

    return () => unsubAuth();
  }, []);

  // Fetch shops
  useEffect(() => {
    const load = async () => {
      const shops = await getAllActiveShops();
      setAllShops(shops);
      setIsLoading(false);
    };
    load();
  }, []);

  // Touch drag handlers for the drag handle only
  const handleDragStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    startYRef.current = clientY;
    startHeightRef.current = panelHeightRef.current ?? window.innerHeight * 0.62;
    isDraggingRef.current = true;
    setIsDragging(true);
  }, []);

  const handleDragMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = startYRef.current - clientY;
    const newHeight = Math.min(
      Math.max(startHeightRef.current + deltaY, 200),
      window.innerHeight - 100
    );
    setPanelHeight(newHeight);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    const currentHeight = panelHeightRef.current ?? window.innerHeight * 0.62;
    const snapThreshold = window.innerHeight * 0.35;

    if (currentHeight > window.innerHeight - snapThreshold) {
      setPanelHeight(window.innerHeight - 100);
    } else {
      setPanelHeight(window.innerHeight * 0.62);
    }
  }, []);

  const filteredShops = allShops.filter(s => {
    if (!searchQuery) return true;
    return s.shopName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Mobile Panel Content
  const panelContent = (
    <>
      {/* Drag Handle */}
      <div
        className="flex justify-center pt-3 pb-1 shrink-0 bg-white cursor-grab active:cursor-grabbing select-none"
        style={{ touchAction: 'none' }}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
        onMouseDown={handleDragStart}
      >
        <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
      </div>

      {/* Search bar */}
      <div className="px-4 pb-2 lg:px-5 shrink-0 bg-white">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder={translate("searchShops")}
            translate="no"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="notranslate w-full h-10 pl-9 pr-9 rounded-2xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-500 outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center justify-between mt-2 pb-1">
          <p className="text-xs text-gray-600">
            {filteredShops.length} {translate("shopsAvailable")}
          </p>
        </div>
      </div>

      {/* Shop list */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 pb-6 lg:px-5 custom-scrollbar">
        {isLoading ? (
          <SkeletonExploreList />
        ) : filteredShops.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100 mt-2">
            <Scissors className="mx-auto h-10 w-10 text-gray-300 mb-3" />
            <h3 className="text-sm font-medium text-gray-900">{translate("noShopsFound")}</h3>
            <p className="text-xs text-gray-600 mt-1">{translate("tryDifferentSearch")}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 mt-2">
            {filteredShops.map((shop) => (
              <ShopCard 
                  key={shop.id} 
                  shop={shop} 
                  router={router} 
                  selectedShopId={selectedShopId} 
                  setSelectedShopId={setSelectedShopId} 
              />
            ))}
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="relative flex-1 w-full h-full flex flex-col lg:flex-row overflow-hidden">
      
      {/* ── Upcoming booking alert — fixed at top below navbar ── */}
      {upcomingBooking && (
        <div className="fixed top-14 left-0 right-0 z-30 px-4 pt-2 pb-1 bg-gradient-to-b from-black/10 to-transparent pointer-events-none">
          <div className="pointer-events-auto">
            <UpcomingBookingAlert booking={upcomingBooking} />
          </div>
        </div>
      )}

      {/* Google Maps Embed */}
      {/* On mobile: map takes fixed top portion (non-overlapping with panel) */}
      {/* On desktop: map takes flex-1 left side */}
      {isMobile ? (
        <div style={{ height: '38vh' }} className="w-full bg-gray-100 shrink-0 relative overflow-hidden">
          <iframe
            src={(() => {
              let q = "barber shops near me";
              const selectedShop = allShops.find(s => s.id === selectedShopId);
              if (selectedShop) {
                const link = selectedShop.googleMapLink;
                if (link) {
                  if (link.includes("/embed?") || link.includes("/embed/")) {
                    const m = link.match(/src="([^"]+)"/);
                    return m ? m[1] : link;
                  }
                  const cm = link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                  if (cm) q = `${cm[1]},${cm[2]}`;
                  else if (link.startsWith("http")) q = `${selectedShop.shopName} ${selectedShop.address || ""}`.trim();
                  else q = link;
                } else {
                  q = `${selectedShop.shopName} ${selectedShop.address || ""}`.trim();
                }
              }
              return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
            })()}
            className="absolute inset-0 w-full h-full border-0"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : (
        <div className="flex-1 lg:relative lg:flex-1 lg:h-full bg-gray-100 shrink-0">
          <div className="w-full h-full relative overflow-hidden">
            <iframe
              src={(() => {
                let q = "barber shops near me";
                const selectedShop = allShops.find(s => s.id === selectedShopId);
                if (selectedShop) {
                  const link = selectedShop.googleMapLink;
                  if (link) {
                    if (link.includes("/embed?") || link.includes("/embed/")) {
                      const m = link.match(/src="([^"]+)"/);
                      return m ? m[1] : link;
                    }
                    const cm = link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                    if (cm) q = `${cm[1]},${cm[2]}`;
                    else if (link.startsWith("http")) q = `${selectedShop.shopName} ${selectedShop.address || ""}`.trim();
                    else q = link;
                  } else {
                    q = `${selectedShop.shopName} ${selectedShop.address || ""}`.trim();
                  }
                }
                return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
              })()}
              className="absolute inset-0 w-full h-full border-0"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      )}

      {/* Mobile: Draggable bottom sheet (below map, non-overlapping) */}
      {isMobile && (
        <div
          className="flex flex-col overflow-hidden bg-white"
          style={{
            flex: 1,
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
            zIndex: 10,
          }}
        >
          {panelContent}
        </div>
      )}

      {/* Desktop: Side panel */}
      {!isMobile && (
        <div className="flex flex-col overflow-hidden lg:max-w-[420px] lg:border-l lg:border-gray-200 flex-1">
          {panelContent}
        </div>
      )}
    </div>
  );
}
