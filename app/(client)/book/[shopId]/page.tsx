"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { getShopDetails, createBooking, getAvailableSlots } from "@/app/actions/client";
import {
  Scissors, Clock, Loader2, ChevronLeft, Phone,
  Search, X, Check, Map as MapIcon
} from "lucide-react";
import { SkeletonForm } from "@/components/Skeleton";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import Link from "next/link";

// ─── Success overlay ─────────────────────────────────────────────
function BookingSuccess({ shopName, time, onDone }: {
  shopName: string;
  time: string;
  onDone: () => void;
}) {
  const [show, setShow] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setShow(true));
    const t = setTimeout(() => setShowContent(true), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 transition-opacity duration-500"
      style={{ opacity: show ? 1 : 0 }}
    >
      <div
        className={`bg-white rounded-3xl p-8 mx-4 max-w-sm w-full text-center transition-all duration-500 ${
          showContent ? "scale-100 opacity-100" : "scale-75 opacity-0"
        }`}
        style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
          <div
            className={`w-16 h-16 rounded-full bg-green-500 flex items-center justify-center transition-all duration-500 ${
              showContent ? "scale-100" : "scale-0"
            }`}
            style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)", transitionDelay: "200ms" }}
          >
            <Check size={32} className="text-white" strokeWidth={3} />
          </div>
        </div>

        <h2
          className={`text-2xl font-bold text-gray-900 mb-2 transition-all duration-500 ${
            showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: "400ms" }}
        >
          Booking Confirmed!
        </h2>
        <p
          className={`text-gray-600 mb-1 transition-all duration-500 ${
            showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: "500ms" }}
        >
          We&apos;ll see you at <strong>{time}</strong>
        </p>
        <p
          className={`text-sm text-gray-400 mb-8 transition-all duration-500 ${
            showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: "600ms" }}
        >
          at {shopName}
        </p>

        <button
          onClick={onDone}
          className={`w-full h-12 rounded-2xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 active:bg-violet-800 transition-all ${
            showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: "700ms" }}
        >
          Back to Explore
        </button>
      </div>
    </div>
  );
}

// ─── Preserve selected services across navigations ───────────────
const STORAGE_KEY = "pending_booking";

interface PendingBooking {
  shopId: string;
  serviceIds: string[];
  time: string;
}

function clearPendingBooking(shopId: string) {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: PendingBooking = JSON.parse(stored);
      if (parsed.shopId === shopId) sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch { /* ignore */ }
}

function savePendingBooking(data: PendingBooking) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

function loadPendingBooking(shopId: string): Partial<PendingBooking> | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: PendingBooking = JSON.parse(stored);
      if (parsed.shopId === shopId) return parsed;
    }
  } catch { /* ignore */ }
  return null;
}

// ─── Helper: format minutes → "1h 30m" ──────────────────────────
function formatDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

// ═══════════════════════════════════════════════════════════════════
// PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════
export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const shopId = params.shopId as string;

  const [shop, setShop] = useState<any>(null);
  const [isLoadingShop, setIsLoadingShop] = useState(true);
  const [session, setSession] = useState<User | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedTime, setSelectedTime] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await getShopDetails(shopId);
      setShop(data);
      setIsLoadingShop(false);
    })();
    const unsub = onAuthStateChanged(auth, (u) => setSession(u));
    return () => unsub();
  }, [shopId]);

  useEffect(() => {
    if (!isLoadingShop && shop?.services) {
      const pending = loadPendingBooking(shopId);
      if (pending?.serviceIds?.length) {
        const validIds = pending.serviceIds.filter((id: string) =>
          shop.services.some((s: any) => s.id === id)
        );
        if (validIds.length) setSelectedServiceIds(new Set(validIds));
        if (pending.time) setSelectedTime(pending.time);
      }
    }
  }, [isLoadingShop, shopId]);

  const services = useMemo(
    () => (shop?.services || []).filter((s: any) => s.isActive !== false),
    [shop]
  );

  const filteredServices = useMemo(
    () =>
      searchQuery
        ? services.filter((s: any) =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : services,
    [services, searchQuery]
  );

  const selectedServices = useMemo(
    () => services.filter((s: any) => selectedServiceIds.has(s.id)),
    [services, selectedServiceIds]
  );

  const totalPrice = useMemo(
    () => selectedServices.reduce((sum: number, s: any) => sum + Number(s.price), 0),
    [selectedServices]
  );

  const totalDuration = useMemo(
    () =>
      selectedServices.reduce(
        (sum: number, s: any) => sum + (parseInt(s.duration, 10) || 30),
        0
      ),
    [selectedServices]
  );

  useEffect(() => {
    if (selectedServiceIds.size === 0) {
      setAvailableSlots([]);
      setSelectedTime("");
      return;
    }
    setIsLoadingSlots(true);
    setSelectedTime("");
    (async () => {
      const slots = await getAvailableSlots(shopId, selectedDate, totalDuration);
      setAvailableSlots(slots);
      setIsLoadingSlots(false);
      const pending = loadPendingBooking(shopId);
      if (pending?.time && slots.includes(pending.time)) {
        setSelectedTime(pending.time);
      }
    })();
  }, [selectedServiceIds, selectedDate, shopId, totalDuration]);

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setError("");
  };

  const handleConfirm = async () => {
    if (!session) { setError("Please sign in to book."); return; }
    if (selectedServiceIds.size === 0) { setError("Please select at least one service."); return; }
    if (!selectedTime) { setError("Please select a time slot."); return; }

    setIsBooking(true);
    setError("");

    const result = await createBooking({
      shopId,
      serviceIds: Array.from(selectedServiceIds),
      time: selectedTime,
    });

    if (result.success) {
      clearPendingBooking(shopId);
      setShowSuccess(true);
    } else {
      setError(result.error || "Booking failed. Please try again.");
    }
    setIsBooking(false);
  };

  useEffect(() => {
    if (selectedServiceIds.size > 0 || selectedTime) {
      savePendingBooking({
        shopId,
        serviceIds: Array.from(selectedServiceIds),
        time: selectedTime,
      });
    }
  }, [selectedServiceIds, selectedTime, shopId]);

  if (isLoadingShop) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <SkeletonForm />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Shop not found</h2>
          <Link href="/explore" className="text-violet-600 font-medium">Back to Explore</Link>
        </div>
      </div>
    );
  }

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" style={{ paddingBottom: 0 }}>
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-4 h-14 flex items-center gap-3 shrink-0">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 transition-colors -ml-1"
        >
          <ChevronLeft size={20} className="text-gray-700" />
        </button>
        <h1 className="text-[17px] font-bold text-gray-900 truncate">Book Appointment</h1>
      </div>

      {/* ── Scrollable content ───────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          {/* ═══ Shop Info Banner ═══ */}
          <div className="bg-white px-4 sm:px-6 py-3.5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center shrink-0 overflow-hidden border border-gray-100">
                {shop.logoUrl ? (
                  <img src={shop.logoUrl} alt={shop.shopName} className="w-full h-full object-cover" />
                ) : (
                  <Scissors size={22} className="text-violet-500" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold text-gray-900 truncate">{shop.shopName}</h2>
                <p className="text-[11px] text-gray-500 truncate mt-0.5">{shop.address || "Local Shop"}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {shop.googleMapLink && (
                  <a href={shop.googleMapLink} target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center hover:bg-violet-100 active:bg-violet-200 transition-all">
                    <MapIcon size={17} />
                  </a>
                )}
                {shop.phone && (
                  <a href={`tel:${shop.phone}`}
                    className="w-9 h-9 rounded-xl bg-gray-50 text-gray-600 flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 transition-all">
                    <Phone size={17} />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* ═══ Service Search ═══ */}
          <div className="bg-white px-4 sm:px-6 pt-4 pb-2 border-b border-gray-100">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-9 rounded-2xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-500 outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={15} />
                </button>
              )}
            </div>
            {!searchQuery && (
              <p className="text-[11px] text-gray-400 mt-1.5 ml-1">
                {services.length} service{services.length !== 1 ? "s" : ""} available
              </p>
            )}
          </div>

          {/* ═══ Services List ═══ */}
          <div className="px-4 sm:px-6 pt-3 pb-4 space-y-2 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0">
            {filteredServices.length === 0 ? (
              <div className="col-span-2 text-center py-12">
                <Scissors size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-500">No services found</p>
                {searchQuery && <p className="text-xs text-gray-400 mt-1">Try a different search term.</p>}
              </div>
            ) : (
              filteredServices.map((service: any) => {
                const isSelected = selectedServiceIds.has(service.id);
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => toggleService(service.id)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all active:scale-[0.99] ${
                      isSelected
                        ? "border-violet-600 bg-violet-50 ring-1 ring-violet-600/20"
                        : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        isSelected ? "bg-violet-600 border-violet-600" : "border-gray-300"
                      }`}
                    >
                      {isSelected && <Check size={14} className="text-white" strokeWidth={3} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-gray-900">{service.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                        <Clock size={11} /> {formatDuration(service.duration)}
                      </p>
                    </div>
                    <div className="text-sm font-bold text-gray-900 shrink-0">
                      ₹{Number(service.price).toFixed(2)}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="h-[180px]" />
        </div>
      </div>

      {/* ── Error toast ──────────────────────────────────────── */}
      {error && (
        <div className="fixed top-16 left-4 right-4 z-50 bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-2xl text-sm flex items-start gap-2.5 shadow-lg animate-slideDown">
          <X size={16} className="mt-0.5 shrink-0 cursor-pointer" onClick={() => setError("")} />
          <span>{error}</span>
        </div>
      )}

      {/* ── Bottom sticky bar ────────────────────────────────── */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
        <div className="max-w-2xl mx-auto px-4 py-3 pb-[calc(env(safe-area-inset-bottom,12px)+4px)]">
          {/* Row 1: Date | Time | Total */}
          <div className="flex items-center gap-2 mb-2.5">
            <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-center">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Date</p>
              <p className="text-sm font-bold text-gray-900">Today</p>
            </div>

            <button
              onClick={() => {
                if (selectedServiceIds.size > 0 && !isLoadingSlots) setShowTimePicker(true);
              }}
              disabled={selectedServiceIds.size === 0 || isLoadingSlots}
              className={`flex-1 rounded-xl px-3 py-2 text-center transition-all ${
                selectedTime
                  ? "bg-violet-50 border border-violet-200"
                  : selectedServiceIds.size > 0 && !isLoadingSlots
                    ? "bg-gray-50 border border-dashed border-gray-300 hover:border-violet-400 hover:bg-violet-50/30"
                    : "bg-gray-50 border border-dashed border-gray-200 opacity-50"
              }`}
            >
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Time</p>
              <p className={`text-sm font-bold flex items-center justify-center gap-1 ${selectedTime ? "text-violet-700" : "text-gray-400"}`}>
                {isLoadingSlots ? "Loading..." : selectedTime ? selectedTime : selectedServiceIds.size === 0 ? "Select" : "Choose"}
                <Clock size={13} />
              </p>
            </button>

            <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-center">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Total</p>
              <p className="text-sm font-bold text-gray-900">₹{totalPrice.toFixed(2)}</p>
            </div>
          </div>

          {/* Row 2: Book button */}
          <button
            onClick={handleConfirm}
            disabled={isBooking || selectedServiceIds.size === 0 || !selectedTime}
            className={`w-full h-12 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
              selectedServiceIds.size > 0 && selectedTime
                ? "bg-violet-600 text-white hover:bg-violet-700 active:bg-violet-800 shadow-violet-200/50"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isBooking ? (
              <Loader2 size={18} className="animate-spin" />
            ) : selectedServiceIds.size === 0 ? (
              "Select a Service"
            ) : !selectedTime ? (
              "Choose a Time"
            ) : (
              "Confirm Booking"
            )}
          </button>
        </div>
      </div>

      {/* ── Time Picker Bottom Sheet ─────────────────────────── */}
      {showTimePicker && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowTimePicker(false)} />
          <div className="relative bg-white rounded-t-3xl px-5 pt-5 pb-[calc(env(safe-area-inset-bottom,16px)+8px)] max-h-[55vh] flex flex-col animate-slideUp">
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[17px] font-bold text-gray-900">Choose a time</h3>
              <p className="text-xs text-gray-500">{todayFormatted}</p>
            </div>
            <div className="flex-1 overflow-y-auto -mx-5 px-5">
              {availableSlots.length === 0 ? (
                <div className="text-center py-10">
                  <Clock size={28} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm font-medium text-gray-500">No slots available today</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2.5 pb-2">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedTime === slot;
                    return (
                      <button
                        key={slot}
                        onClick={() => { setSelectedTime(slot); setShowTimePicker(false); }}
                        className={`px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all active:scale-95 ${
                          isSelected
                            ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                            : "bg-gray-50 text-gray-700 border border-gray-200 hover:border-violet-300 hover:bg-violet-50/40"
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Success overlay ──────────────────────────────────── */}
      {showSuccess && (
        <BookingSuccess
          shopName={shop.shopName}
          time={selectedTime}
          onDone={() => {
            setShowSuccess(false);
            // Full page navigation to ensure explore page fetches fresh booking data
            window.location.href = "/explore";
          }}
        />
      )}
    </div>
  );
}
