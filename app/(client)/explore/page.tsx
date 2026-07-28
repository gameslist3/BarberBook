"use client";

import { useState, useEffect } from "react";
import { getAllActiveShops, getAvailableSlots } from "@/app/actions/client";
import { Store, MapPin, Search, X, ExternalLink, Loader2, Map, Phone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function ShopCard({ shop, router, selectedShopId, setSelectedShopId, setSheetExpanded }: any) {
  const [slots, setSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSlots = async () => {
      const today = new Date().toISOString().split('T')[0];
      // Assuming a generic 30 min duration for preview
      const available = await getAvailableSlots(shop.id, today, 30);
      setSlots(available.slice(0, 5)); // show first 5
      setIsLoading(false);
    };
    fetchSlots();
  }, [shop.id]);

  return (
    <div
      onClick={() => { router.push(`/shop/${shop.id}`); }}
      className={`group cursor-pointer bg-white rounded-2xl border overflow-hidden transition-all hover:shadow-md flex flex-col p-4 ${selectedShopId === shop.id ? 'border-indigo-400 shadow-md ring-1 ring-indigo-100' : 'border-gray-200 hover:border-indigo-300'}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center min-w-0 flex-1 pr-2">
          <div className="h-14 w-14 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-gray-100">
            {shop.logoUrl ? (
              <img src={shop.logoUrl} alt={shop.shopName} className="w-full h-full object-cover" />
            ) : (
              <Store className="h-6 w-6 text-indigo-500" />
            )}
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <h3 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">{shop.shopName}</h3>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 truncate">
              <MapPin size={12} className="shrink-0" /> {shop.address || "Local Shop"}
            </p>
            <div className="flex items-center gap-3 mt-1">
                <p className="text-[10px] font-medium text-emerald-600">
                {shop.openTime || "9:00 AM"} - {shop.closeTime || "6:00 PM"}
                </p>
                {shop.phone && (
                    <a onClick={(e) => e.stopPropagation()} href={`tel:${shop.phone}`} className="text-[10px] font-medium text-indigo-600 flex items-center gap-0.5 hover:text-indigo-800 transition-colors">
                        <Phone size={10} /> {shop.phone}
                    </a>
                )}
            </div>
          </div>
        </div>
        
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            if (shop.googleMapLink) {
              setSelectedShopId(shop.id); 
              setSheetExpanded(false);
            }
          }}
          className={`shrink-0 p-2.5 rounded-full transition-colors flex items-center justify-center ${shop.googleMapLink ? (selectedShopId === shop.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100') : 'bg-gray-50 text-gray-300 cursor-not-allowed'}`}
          disabled={!shop.googleMapLink}
          title={shop.googleMapLink ? "View on map" : "Location not set"}
        >
          <Map size={18} />
        </button>
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between min-h-[30px]">
          {isLoading ? (
             <div className="flex items-center gap-2 text-xs text-gray-400">
                <Loader2 className="w-3 h-3 animate-spin" /> Checking availability...
             </div>
          ) : slots.length > 0 ? (
             <button
               onClick={(e) => {
                 e.stopPropagation();
                 router.push(`/shop/${shop.id}`);
               }}
               className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
             >
               Book Now - Next slot at {slots[0]}
             </button>
          ) : (
             <div className="text-xs text-red-500 font-medium">Fully booked today</div>
          )}
        </div>
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
  const [sheetExpanded, setSheetExpanded] = useState(false);

  // Fetch registered shops on mount
  useEffect(() => {
    const load = async () => {
      const shops = await getAllActiveShops();
      setAllShops(shops);
      setIsLoading(false);
    };
    load();
  }, []);

  // Search filter
  const filterBySearch = (name: string) => {
    if (!searchQuery) return true;
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const filteredShops = allShops.filter(s => filterBySearch(s.shopName));

  return (
    <div className="relative flex-1 w-full h-full flex flex-col lg:flex-row overflow-hidden">
      
      {/* Bottom Sheet on Mobile, Left Panel on Desktop */}
      <div className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.12)] z-20 flex flex-col overflow-hidden transition-all duration-300 ease-out lg:relative lg:w-[420px] lg:h-full lg:rounded-none lg:shadow-none lg:border-r lg:border-gray-200 ${sheetExpanded ? 'h-[75vh]' : 'h-[45vh]'}`}>
        {/* Drag handle for mobile */}
        <button 
          className="w-full flex justify-center pt-3 pb-1 lg:hidden shrink-0 bg-white cursor-grab active:cursor-grabbing"
          onClick={() => setSheetExpanded(!sheetExpanded)}
        >
          <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
        </button>

        {/* Search bar */}
        <div className="px-4 pt-2 pb-3 lg:px-5 lg:pt-5 shrink-0 bg-white">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search barber shops..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-9 rounded-xl bg-gray-100 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-400">
              {filteredShops.length} shop{filteredShops.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>

        {/* Shop list */}
        <div className="flex-1 overflow-y-auto px-4 pb-8 lg:px-5 custom-scrollbar">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            </div>
          ) : filteredShops.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100 mt-2">
              <Store className="mx-auto h-10 w-10 text-gray-300 mb-3" />
              <h3 className="text-sm font-medium text-gray-900">No shops found</h3>
              <p className="text-xs text-gray-500 mt-1">Try a different search term.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 mt-1">
              {filteredShops.map((shop) => (
                <ShopCard 
                    key={shop.id} 
                    shop={shop} 
                    router={router} 
                    selectedShopId={selectedShopId} 
                    setSelectedShopId={setSelectedShopId} 
                    setSheetExpanded={setSheetExpanded} 
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Google Maps Embed */}
      <div className="absolute inset-0 z-0 lg:relative lg:flex-1 h-full bg-gray-100">
        <iframe
          src={(() => {
            let q = "barber shops near me";
            const selectedShop = allShops.find(s => s.id === selectedShopId);
            
            if (selectedShop) {
              const link = selectedShop.googleMapLink;
              if (link) {
                if (link.includes("/embed?") || link.includes("/embed/")) {
                  // User pasted the full embed iframe src
                  const match = link.match(/src="([^"]+)"/);
                  return match ? match[1] : link;
                }
                
                const coordMatch = link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                if (coordMatch) {
                  q = `${coordMatch[1]},${coordMatch[2]}`;
                } else if (link.startsWith("http")) {
                  // Fallback to name/address if we can't parse the shortlink
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
          className="w-full h-full border-0"
          style={{ touchAction: 'none' }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
    </div>
  );
}
