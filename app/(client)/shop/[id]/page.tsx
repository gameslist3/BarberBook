"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getShopDetails } from "@/app/actions/client";
import { Scissors, MapPin, Clock, ChevronLeft, Phone, Calendar, Star, Map as MapIcon, CalendarX } from "lucide-react";
import { SkeletonShopDetail } from "@/components/Skeleton";
import Link from "next/link";
import { SafeImage } from "@/components/SafeImage";
import { getKolkataDateString } from "@/lib/timeUtils";

function formatDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export default function ShopDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const shopId = params.id as string;

  const [shop, setShop] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial fetch to get owner and services via server action
    (async () => {
      const data = await getShopDetails(shopId);
      setShop(data);
      setIsLoading(false);
    })();
  }, [shopId]);

  useEffect(() => {
    // Real-time listener for shop document (e.g. holidays changes)
    let unsub = () => {};
    import("firebase/firestore").then(({ doc, onSnapshot }) => {
      import("@/lib/firebase").then(({ db }) => {
        unsub = onSnapshot(doc(db, "shops", shopId), (docSnap) => {
          if (docSnap.exists()) {
            setShop((prev: any) => prev ? { ...prev, ...docSnap.data() } : null);
          }
        });
      });
    });
    return () => unsub();
  }, [shopId]);

  if (isLoading) return <SkeletonShopDetail />;
  if (!shop) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <Scissors size={40} className="mx-auto text-gray-300 mb-3" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Shop not found</h2>
          <Link href="/explore" className="text-sm text-violet-600 font-medium hover:text-violet-800">Back to Explore</Link>
        </div>
      </div>
    );
  }

  const serviceCount = shop.services?.filter((s: any) => s.isActive !== false).length || 0;

  return (
    <div className="max-w-4xl mx-auto px-0 sm:px-4 lg:px-6 pb-24 sm:pb-12 relative overflow-x-hidden">
      {/* ── Back ─────────────────────────────────────────────── */}
      <div className="sm:mb-4">
        <Link
          href="/explore"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white transition-colors px-4 sm:px-0 h-12 sm:h-auto"
        >
          <ChevronLeft size={18} />
          Back
        </Link>
      </div>

      {/* ═══ Hero ═══ */}
      <div className="bg-white dark:bg-gray-900 sm:rounded-2xl shadow-sm border-b sm:border border-gray-200 dark:border-gray-700 overflow-hidden relative">
        {shop.holidays && shop.holidays[getKolkataDateString()] !== undefined && (
          <div 
            className="absolute top-0 right-4 sm:right-6 z-20 px-4 py-2 bg-red-600 text-white text-[12px] font-black uppercase tracking-wider rounded-b-xl shadow-lg border-x border-b border-red-700"
            style={{ 
              transformOrigin: 'top center',
              animation: 'swing 3s ease-in-out infinite'
            }}
          >
            Closed Today
            <div className="absolute top-0 left-2 w-2 h-2.5 bg-gray-900/40 rounded-full shadow-inner"></div>
            <div className="absolute top-0 right-2 w-2 h-2.5 bg-gray-900/40 rounded-full shadow-inner"></div>
          </div>
        )}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes swing {
            0%, 100% { transform: rotate(-3deg); }
            50% { transform: rotate(3deg); }
          }
        `}} />
        {/* Cover */}
        <div className="relative h-36 sm:h-48 w-full overflow-hidden bg-gradient-to-br from-violet-900 to-indigo-800">
          {shop.logoUrl && (
            <SafeImage
              src={shop.logoUrl}
              alt={shop.shopName}
              className="notranslate absolute inset-0 w-full h-full object-contain opacity-50"
              style={{ filter: "brightness(0) invert(1)" }}
              fallback={null}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          {/* Logo floating */}
          {shop.logoUrl && (
            <div className="absolute bottom-3 left-4 w-14 h-14 rounded-2xl border-2 border-white/60 overflow-hidden shadow-lg bg-white dark:bg-gray-900">
              <SafeImage src={shop.logoUrl} alt="" className="w-full h-full object-contain" fallback={null} />
            </div>
          )}
          <div className="absolute bottom-3 right-4 flex gap-2">
            {shop.googleMapLink && (
              <a
                href={shop.googleMapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-white dark:bg-gray-900/90 backdrop-blur flex items-center justify-center text-violet-600 shadow-lg hover:bg-white dark:bg-gray-900 transition-colors"
              >
                <MapIcon size={18} />
              </a>
            )}
            {shop.phone && (
              <a
                href={`tel:${shop.phone}`}
                className="w-10 h-10 rounded-xl bg-white dark:bg-gray-900/90 backdrop-blur flex items-center justify-center text-gray-700 dark:text-gray-300 shadow-lg hover:bg-white dark:bg-gray-900 transition-colors"
              >
                <Phone size={18} />
              </a>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="px-4 sm:px-6 py-4">
          <h1 className="notranslate text-2xl font-bold text-gray-900 dark:text-white">{shop.shopName}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin size={14} className="text-gray-400" />
              {shop.address || "No address"}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} className="text-gray-400" />
              {shop.openTime || "9:00 AM"} – {shop.closeTime || "6:00 PM"}
            </span>
            <span className="flex items-center gap-1 text-violet-600 font-medium">
              <Star size={14} />
              {serviceCount} service{serviceCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────── */}
      <div className="mt-4 space-y-4 px-4 sm:px-0">
        {/* Description */}
        {shop.description && (
          <div className="bg-white dark:bg-gray-900 sm:rounded-2xl rounded-xl border border-gray-100 dark:border-gray-800 p-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1.5">About</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{shop.description}</p>
          </div>
        )}

        {/* Services preview */}
        {serviceCount > 0 && (
          <div className="bg-white dark:bg-gray-900 sm:rounded-2xl rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-900 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Services</h3>
              <span className="text-xs font-medium text-gray-500">{serviceCount} available</span>
            </div>
            <div className="divide-y divide-gray-50">
              {shop.services
                .filter((s: any) => s.isActive !== false)
                .slice(0, 5)
                .map((service: any) => (
                  <div key={service.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{service.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{formatDuration(service.duration)}</p>
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">₹{Number(service.price).toFixed(2)}</span>
                  </div>
                ))}
              {serviceCount > 5 && (
                <div className="px-4 py-2.5 text-center">
                  <span className="text-xs font-medium text-gray-400">+{serviceCount - 5} more services</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Gallery */}
        {shop.images && shop.images.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2 px-1">Gallery</h3>
            <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-2 snap-x snap-mandatory scrollbar-hide">
              {shop.images.map((img: string, idx: number) => (
                <div
                  key={idx}
                  className="snap-start shrink-0 w-48 h-32 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800"
                >
                  <SafeImage
                    src={img}
                    alt={`${shop.shopName} ${idx + 1}`}
                    className="notranslate w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    fallback={
                      <div className="flex items-center justify-center w-full h-full">
                        <Scissors size={20} className="text-gray-300" />
                      </div>
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Location map */}
        <div className="bg-gray-100 rounded-xl overflow-hidden h-48 border border-gray-100 dark:border-gray-800">
          <iframe
            src={(() => {
              let q = "barber shops near me";
              const link = shop.googleMapLink;
              if (link) {
                if (link.includes("/embed?") || link.includes("/embed/")) {
                  const m = link.match(/src="([^"]+)"/);
                  return m ? m[1] : link;
                }
                const cm = link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                if (cm) q = `${cm[1]},${cm[2]}`;
                else if (link.startsWith("http")) q = `${shop.shopName} ${shop.address || ""}`.trim();
                else q = link;
              } else {
                q = `${shop.shopName} ${shop.address || ""}`.trim();
              }
              return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
            })()}
            className="w-full h-full border-0"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>

        {/* ── Sticky Book Now CTA ──────────────────────────────── */}
        {!(shop.holidays && shop.holidays[getKolkataDateString()] !== undefined) && (
          <div className="fixed bottom-0 left-0 right-0 sm:sticky sm:bottom-4 sm:left-auto sm:right-auto bg-white dark:bg-gray-900 border-t sm:border sm:border-gray-200 dark:border-gray-700 sm:rounded-2xl sm:shadow-lg px-4 py-3 sm:py-3 sm:max-w-4xl sm:mx-auto z-10">
            <button
              onClick={() => router.push(`/book/${shopId}`)}
              disabled={serviceCount === 0}
              className="w-full h-12 rounded-2xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 active:bg-violet-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-200/50 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Calendar size={16} />
              {serviceCount > 0 ? "Book Now" : "No Services"}
            </button>
          </div>
        )}
        {shop.holidays && shop.holidays[getKolkataDateString()] !== undefined && (
          <div className="fixed bottom-0 left-0 right-0 sm:sticky sm:bottom-4 sm:left-auto sm:right-auto bg-white dark:bg-gray-900 border-t sm:border sm:border-gray-200 dark:border-gray-700 sm:rounded-2xl sm:shadow-lg px-4 py-3 sm:py-3 sm:max-w-4xl sm:mx-auto z-10">
            <div className="mb-0 p-2.5 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center gap-2">
              <CalendarX size={16} className="text-red-500" />
              <span className="text-sm font-semibold text-red-600">Today is off ({shop.holidays[getKolkataDateString()] || "Closed"})</span>
            </div>
          </div>
        )}
    </div>
  );
}
