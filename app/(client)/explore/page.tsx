"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getAllActiveShops, getAvailableSlots } from "@/app/actions/client";
import { MapPin, Search, X, Loader2, Map, Phone, Scissors } from "lucide-react";
import { useRouter } from "next/navigation";

function ShopCard({ shop, router, selectedShopId, setSelectedShopId }: any) {
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
                <img src={shop.logoUrl} alt={shop.shopName} className="w-full h-full object-cover" />
              ) : (
                <Scissors className="h-6 w-6 text-violet-500" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-[17px] font-bold text-gray-900 truncate">{shop.shopName}</h3>
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
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Checking availability...
          </div>
        ) : slots.length > 0 ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/shop/${shop.id}`);
            }}
            className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm shadow-violet-200 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            Book Now - Next slot at {slots[0]}
          </button>
        ) : (
          <div className="text-center py-2.5 text-xs font-semibold text-red-600 bg-red-50 rounded-xl">
            Fully booked today
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const router = useRouter();
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
    // Set default panel height on mobile
    setPanelHeight(window.innerHeight * 0.55);

    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Keep panelHeightRef in sync with state
  useEffect(() => {
    panelHeightRef.current = panelHeight;
  }, [panelHeight]);

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
    startHeightRef.current = panelHeightRef.current ?? window.innerHeight * 0.55;
    isDraggingRef.current = true;
    setIsDragging(true);
  }, []);

  const handleDragMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = startYRef.current - clientY;
    const newHeight = Math.min(
      Math.max(startHeightRef.current + deltaY, 180),
      window.innerHeight - 80
    );
    setPanelHeight(newHeight);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    const currentHeight = panelHeightRef.current ?? window.innerHeight * 0.55;
    const snapThreshold = window.innerHeight * 0.35;

    if (currentHeight > window.innerHeight - snapThreshold) {
      setPanelHeight(window.innerHeight - 80);
    } else {
      setPanelHeight(window.innerHeight * 0.55);
    }
  }, []);

  // Mouse drag support
  useEffect(() => {
    if (!isMobile) return;
    const handleMouseMove = (e: MouseEvent) => handleDragMove(e as any);
    const handleMouseUp = () => handleDragEnd();
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isMobile]);

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
            placeholder="Search barber shops..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-9 rounded-2xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-500 outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center justify-between mt-2 pb-1">
          <p className="text-xs text-gray-600">
            {filteredShops.length} shop{filteredShops.length !== 1 ? 's' : ''} available
          </p>
        </div>
      </div>

      {/* Shop list */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 pb-6 lg:px-5 custom-scrollbar">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
          </div>
        ) : filteredShops.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100 mt-2">
            <Scissors className="mx-auto h-10 w-10 text-gray-300 mb-3" />
            <h3 className="text-sm font-medium text-gray-900">No shops found</h3>
            <p className="text-xs text-gray-600 mt-1">Try a different search term.</p>
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
      
      {/* Google Maps Embed */}
      <div className="flex-1 lg:relative lg:flex-1 lg:h-full bg-gray-100 shrink-0">
        <div className={`${isMobile ? 'h-full' : 'h-full'} w-full relative overflow-hidden`}>
          <iframe
            src={(() => {
              let q = "barber shops near me";
              const selectedShop = allShops.find(s => s.id === selectedShopId);
              
              if (selectedShop) {
                const link = selectedShop.googleMapLink;
                if (link) {
                  if (link.includes("/embed?") || link.includes("/embed/")) {
                    const match = link.match(/src="([^"]+)"/);
                    return match ? match[1] : link;
                  }
                  
                  const coordMatch = link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                  if (coordMatch) {
                    q = `${coordMatch[1]},${coordMatch[2]}`;
                  } else if (link.startsWith("http")) {
                    q = `${selectedShop.shopName} ${selectedShop.address || ""}`.trim();
                  } else {
                    q = link;
                  }
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
          ></iframe>
        </div>
      </div>

      {/* Mobile: Draggable bottom sheet */}
      {isMobile && (
        <div
          className="flex flex-col overflow-hidden"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: panelHeight ?? '55vh',
            backgroundColor: 'white',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            boxShadow: '0 -8px 30px rgba(0,0,0,0.08)',
            zIndex: 20,
            transition: isDragging ? 'none' : 'height 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
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
