"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getShopDetails, createBooking, getAvailableSlots, checkUserActiveBooking, checkCustomTimeAvailability } from "@/app/actions/client";
import { getKolkataDateString } from "@/lib/timeUtils";
import {
  Scissors,  Clock, Loader2, ChevronLeft, ChevronUp, ChevronDown, Phone,
  Search, X, Check, Map as MapIcon
} from "lucide-react";
import { SkeletonForm } from "@/components/Skeleton";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageContext";
import { SafeImage } from "@/components/SafeImage";

// ─── Success overlay ─────────────────────────────────────────────
function BookingSuccess({ shopName, time, onDone }: {
  shopName: string;
  time: string;
  onDone: () => void;
}) {
  const { translate } = useLanguage();
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
          {translate("bookingConfirmed")}
        </h2>
        <p
          className={`text-gray-600 mb-1 transition-all duration-500 ${
            showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: "500ms" }}
        >
          {translate("seeYouAt")} <strong>{time}</strong>
        </p>
        <p
          className={`text-sm text-gray-400 mb-8 transition-all duration-500 ${
            showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: "600ms" }}
        >
          at <span className="notranslate">{shopName}</span>
        </p>

        <button
          onClick={onDone}
          className={`w-full h-12 rounded-2xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 active:bg-violet-800 transition-all ${
            showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: "700ms" }}
        >
          {translate("goToSession")}
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

function formatCustomTime(hour: number, minute: number, ampm: 'AM' | 'PM'): string {
  return `${hour}:${minute.toString().padStart(2, '0')} ${ampm}`;
}

// Convert 12h format to minutes from midnight for comparison
function customTimeToMinutes(hour: number, minute: number, ampm: 'AM' | 'PM'): number {
  let h = hour;
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return h * 60 + minute;
}

// Convert "HH:mm AM/PM" string to minutes from midnight
function parseTimeStrToMinutes(timeStr: string): number {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = match[3]?.toUpperCase();
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}

// ═══════════════════════════════════════════════════════════════════
// PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════
export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const shopId = params.shopId as string;
  const { translate } = useLanguage();

  const [shop, setShop] = useState<any>(null);
  const [isLoadingShop, setIsLoadingShop] = useState(true);
  const [session, setSession] = useState<User | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState(() => getKolkataDateString());
  const [selectedTime, setSelectedTime] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timeMode, setTimeMode] = useState<'available' | 'custom'>('available');
  const [customHour, setCustomHour] = useState(9);
  const [customMinute, setCustomMinute] = useState(0);
  const [customAmPm, setCustomAmPm] = useState<'AM' | 'PM'>('AM');
  const [customStatus, setCustomStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle');
  const [customNextAvailable, setCustomNextAvailable] = useState<string | null>(null);
  const [customUnavailableReason, setCustomUnavailableReason] = useState<string | null>(null);

  // ── Drag-to-scroll & tap-to-edit ────────────────────────
  const dragState = useRef<{ type: 'hour' | 'minute'; startY: number; accumulated: number; lastTime: number; speed: number } | null>(null);
  const [editingType, setEditingType] = useState<'hour' | 'minute' | null>(null);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);
  const customHourRef = useRef(customHour);
  const customMinuteRef = useRef(customMinute);
  const customAmPmRef = useRef(customAmPm);

  // ── Shop hours for custom time validation ────────────────
  const shopHours = useMemo(() => {
    if (!shop) return { openMinutes: 540, closeMinutes: 1080 }; // default 9AM–6PM
    const open = shop.openTime || "9:00 AM";
    const close = shop.closeTime || "6:00 PM";
    return {
      openMinutes: parseTimeStrToMinutes(open),
      closeMinutes: parseTimeStrToMinutes(close),
      openTimeStr: open,
      closeTimeStr: close,
    };
  }, [shop]);

  // Initialize custom time when tab switches to custom
  useEffect(() => {
    if (timeMode === 'custom') {
      if (selectedTime) {
        const match = selectedTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (match) {
          setCustomHour(parseInt(match[1], 10));
          setCustomMinute(parseInt(match[2], 10));
          setCustomAmPm(match[3].toUpperCase() as 'AM' | 'PM');
        }
      } else {
        // Default to shop opening time or current time (whichever is later)
        const now = new Date();
        let h = now.getHours();
        const m = Math.ceil(now.getMinutes() / 5) * 5;
        const ampm = h >= 12 ? 'PM' : 'AM';
        if (h > 12) h -= 12;
        if (h === 0) h = 12;
        const currentMins = customTimeToMinutes(h, m >= 60 ? 0 : m, ampm);
        // Default to the max of current time and shop opening time
        if (currentMins < shopHours.openMinutes) {
          // Set to shop opening time
          const openH = Math.floor(shopHours.openMinutes / 60);
          const openM = shopHours.openMinutes % 60;
          const openAmPm = openH >= 12 ? 'PM' : 'AM';
          const displayH = openH > 12 ? openH - 12 : openH === 0 ? 12 : openH;
          setCustomHour(displayH);
          setCustomMinute(openM);
          setCustomAmPm(openAmPm as 'AM' | 'PM');
        } else {
          setCustomHour(h);
          setCustomMinute(m >= 60 ? 0 : m);
          setCustomAmPm(ampm);
        }
      }
    }
  }, [timeMode]);

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

  // ── Refs kept in sync for drag handler ───────────────────
  useEffect(() => { customHourRef.current = customHour; }, [customHour]);
  useEffect(() => { customMinuteRef.current = customMinute; }, [customMinute]);
  useEffect(() => { customAmPmRef.current = customAmPm; }, [customAmPm]);
  const shopHoursRef = useRef(shopHours);
  useEffect(() => { shopHoursRef.current = shopHours; }, [shopHours]);
  const totalDurationRef = useRef(totalDuration);
  useEffect(() => { totalDurationRef.current = totalDuration; }, [totalDuration]);

  // Focus & select input when entering edit mode
  useEffect(() => {
    if (editingType && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingType]);

  // Check time stays within shop hours (accounting for total duration)
  const isValidTime = useCallback((hour: number, minute: number, ampm: 'AM' | 'PM') => {
    const mins = customTimeToMinutes(hour, minute, ampm);
    const latestStart = shopHoursRef.current.closeMinutes - totalDurationRef.current;
    return mins >= shopHoursRef.current.openMinutes && mins + totalDurationRef.current <= shopHoursRef.current.closeMinutes;
  }, []);

  // ── Drag-to-scroll for hour/minute digits ────────────────
  const handleDigitPointerDown = useCallback((type: 'hour' | 'minute', e: React.MouseEvent | React.TouchEvent) => {
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragState.current = {
      type,
      startY: clientY,
      accumulated: 0,
      lastTime: Date.now(),
      speed: 1,
    };
    e.preventDefault();

    const handleMove = (me: MouseEvent | TouchEvent) => {
      if (!dragState.current) return;
      me.preventDefault();
      const clientY2 = 'touches' in me ? (me as TouchEvent).touches[0].clientY : (me as MouseEvent).clientY;
      const deltaY = dragState.current.startY - clientY2;
      const now = Date.now();
      const dt = now - dragState.current.lastTime;

      // Gentle speed multiplier: slightly faster when dragging quickly
      if (dt > 0) {
        const pxPerSec = Math.abs(deltaY - dragState.current.accumulated) / (dt / 1000);
        dragState.current.speed = Math.max(1, Math.min(3, Math.floor(pxPerSec / 250) + 1));
      }
      dragState.current.lastTime = now;

      const threshold = 12 / dragState.current.speed;
      const totalChanges = Math.floor(deltaY / threshold);
      const changes = totalChanges - dragState.current.accumulated;

      if (changes !== 0) {
        dragState.current.accumulated = totalChanges;

        if (type === 'hour') {
          setCustomHour(prev => {
            let newH = prev + changes;
            if (newH > 12) newH = 12;
            if (newH < 1) newH = 1;
            return isValidTime(newH, customMinuteRef.current, customAmPmRef.current) ? newH : prev;
          });
        } else {
          setCustomMinute(prev => {
            let newM = prev + changes;
            if (newM > 59) newM = 59;
            if (newM < 0) newM = 0;
            return isValidTime(customHourRef.current, newM, customAmPmRef.current) ? newM : prev;
          });
        }
      }
    };

    const handleUp = () => {
      const wasDragged = dragState.current && Math.abs(dragState.current.accumulated) >= 1;
      if (dragState.current && !wasDragged) {
        // Tap (no significant drag) → open edit
        setEditingType(type);
        setEditValue(type === 'hour'
          ? customHourRef.current.toString()
          : customMinuteRef.current.toString().padStart(2, '0')
        );
      }
      dragState.current = null;
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleUp);
    };

    document.addEventListener('mousemove', handleMove, { passive: false });
    document.addEventListener('mouseup', handleUp);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleUp);
  }, [isValidTime]);

  // ── Commit edited value on blur / Enter ─────────────────
  const commitEdit = useCallback(() => {
    if (!editingType) return;
    const raw = editValue.trim();
    const num = parseInt(raw, 10);
    if (isNaN(num)) { setEditingType(null); return; }

    if (editingType === 'hour') {
      if (num >= 1 && num <= 12 && isValidTime(num, customMinuteRef.current, customAmPmRef.current)) {
        setCustomHour(num);
      }
    } else {
      if (num >= 0 && num <= 59 && isValidTime(customHourRef.current, num, customAmPmRef.current)) {
        setCustomMinute(num);
      }
    }
    setEditingType(null);
  }, [editingType, editValue, isValidTime]);

  // Check if the current custom time is within shop hours (accounting for total duration)
  const isCustomTimeValid = useMemo(() => {
    const customMins = customTimeToMinutes(customHour, customMinute, customAmPm);
    const latestStart = shopHours.closeMinutes - totalDuration;
    return customMins >= shopHours.openMinutes && customMins <= latestStart;
  }, [customHour, customMinute, customAmPm, shopHours, totalDuration]);

  // ── Fetch the earliest available time (computed live, no fixed slots) ──
  const fetchNextSlot = useCallback(async () => {
    const slots = await getAvailableSlots(shopId, selectedDate, totalDuration);
    setAvailableSlots(slots);
    return slots;
  }, [shopId, selectedDate, totalDuration]);

  useEffect(() => {
    if (selectedServiceIds.size === 0) {
      setAvailableSlots([]);
      setSelectedTime("");
      return;
    }
    setIsLoadingSlots(true);
    setSelectedTime("");
    (async () => {
      const slots = await fetchNextSlot();
      setIsLoadingSlots(false);
      const pending = loadPendingBooking(shopId);
      if (pending?.time && slots.includes(pending.time)) {
        setSelectedTime(pending.time);
      }
    })();
  }, [selectedServiceIds, selectedDate, shopId, totalDuration, fetchNextSlot]);

  // ── Keep "Next Schedule" dynamic: refresh every 30s while the Next
  //    Schedule tab is open, so the time follows the real clock and any
  //    booking made meanwhile (no page refresh needed) ────────────────
  useEffect(() => {
    if (!showTimePicker || timeMode !== "available" || selectedServiceIds.size === 0) return;
    fetchNextSlot();
    const interval = setInterval(() => {
      // Keep the date fresh too, so the schedule stays live across midnight.
      // If the day changed, the effect re-runs and fetches with the new date;
      // otherwise just refresh the next-slot time.
      const date = getKolkataDateString();
      if (date !== selectedDate) setSelectedDate(date);
      else fetchNextSlot();
    }, 30000);
    return () => clearInterval(interval);
  }, [showTimePicker, timeMode, selectedServiceIds, selectedDate, shopId, totalDuration, fetchNextSlot]);

  // ── Keep "Custom Time" live too: validate the picked time against the
  //    real schedule (past / outside hours / already booked), refresh every
  //    30s while the tab is open, and offer the next free slot as a quick
  //    fix. If the picker re-opens with a new date the check re-runs. ─────
  const customCheckSeq = useRef(0);
  const checkCustomTime = useCallback(async (silent = false) => {
    if (selectedServiceIds.size === 0 || !isCustomTimeValid) {
      customCheckSeq.current += 1; // invalidate any in-flight check
      setCustomStatus('idle');
      setCustomNextAvailable(null);
      setCustomUnavailableReason(null);
      return;
    }
    const seq = ++customCheckSeq.current;
    // Silent background refreshes keep the last known status visible so the
    // banner doesn't flicker to "Checking..." every 30s for no reason.
    if (!silent) setCustomStatus('checking');
    const res = await checkCustomTimeAvailability(
      shopId,
      selectedDate,
      formatCustomTime(customHour, customMinute, customAmPm),
      totalDuration
    );
    // Ignore stale responses — a newer check (time change, date rollover) won.
    if (seq !== customCheckSeq.current) return;
    setCustomStatus(res.available ? 'available' : 'unavailable');
    setCustomNextAvailable(res.nextAvailable);
    setCustomUnavailableReason(res.reason);
  }, [shopId, selectedDate, customHour, customMinute, customAmPm, totalDuration, isCustomTimeValid, selectedServiceIds]);

  useEffect(() => {
    if (!showTimePicker || timeMode !== "custom" || selectedServiceIds.size === 0) return;
    // Debounce the live check so rapid stepper drags don't fire a server
    // call per step — only the settled time value gets validated.
    const debounce = setTimeout(() => checkCustomTime(), 300);
    const interval = setInterval(() => {
      // Keep the date fresh too, so the check stays live across midnight.
      // Background refreshes are silent — no "Checking..." flicker.
      const date = getKolkataDateString();
      if (date !== selectedDate) setSelectedDate(date);
      else checkCustomTime(true);
    }, 30000);
    return () => {
      clearTimeout(debounce);
      clearInterval(interval);
      customCheckSeq.current += 1; // invalidate any in-flight check on close/change
    };
  }, [showTimePicker, timeMode, selectedServiceIds, selectedDate, checkCustomTime]);

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
    if (!session) { setError(translate("signInToBook")); return; }
    if (selectedServiceIds.size === 0) { setError(translate("selectService")); return; }
    if (!selectedTime) { setError(translate("chooseTime")); return; }

    setIsBooking(true);
    setError("");

    // Client-side check for existing active booking
    const activeCheck = await checkUserActiveBooking();
    if (activeCheck.hasActive) {
      setError(translate("activeBookingExists"));
      setIsBooking(false);
      return;
    }

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

  // After a successful booking, move the user into the locked session screen.
  useEffect(() => {
    if (!showSuccess) return;
    const t = setTimeout(() => {
      router.push("/session");
    }, 2500);
    return () => clearTimeout(t);
  }, [showSuccess, router]);

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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{translate("shopNotFound")}</h2>
          <Link href="/explore" className="text-violet-600 font-medium">{translate("backToExplore")}</Link>
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
        <h1 className="text-[17px] font-bold text-gray-900 truncate">{translate("bookAppointment")}</h1>
      </div>

      {/* ── Scrollable content ───────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          {/* ═══ Shop Info Banner ═══ */}
          <div className="bg-white px-4 sm:px-6 py-3.5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center shrink-0 overflow-hidden border border-gray-100">
                <SafeImage
                  src={shop.logoUrl}
                  alt={shop.shopName}
                  className="notranslate w-full h-full object-cover"
                  fallback={<Scissors size={22} className="text-violet-500" />}
                />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="notranslate text-base font-bold text-gray-900 truncate">{shop.shopName}</h2>
                <p className="text-[11px] text-gray-500 truncate mt-0.5">{shop.address || translate("localShop")}</p>
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
                placeholder={translate("searchServices")}
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
                {services.length} {translate("servicesAvailable")}
              </p>
            )}
          </div>

          {/* ═══ Services List ═══ */}
          <div className="px-4 sm:px-6 pt-3 pb-4 space-y-2 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0">
            {filteredServices.length === 0 ? (
              <div className="col-span-2 text-center py-12">
                <Scissors size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-500">{translate("noServicesFound")}</p>
                {searchQuery && <p className="text-xs text-gray-400 mt-1">{translate("tryDifferentSearch")}</p>}
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
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{translate("date")}</p>
              <p className="text-sm font-bold text-gray-900">{translate("today")}</p>
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
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{translate("time")}</p>
              <p className={`text-sm font-bold flex items-center justify-center gap-1 ${selectedTime ? "text-violet-700" : "text-gray-400"}`}>
                {isLoadingSlots ? translate("loading") : selectedTime ? selectedTime : selectedServiceIds.size === 0 ? translate("select") : availableSlots.length > 0 ? availableSlots[0] : translate("choose")}
                <Clock size={13} />
              </p>
            </button>

            <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-center">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{translate("total")}</p>
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
              translate("selectService")
            ) : !selectedTime ? (
              translate("chooseTime")
            ) : (
              translate("confirmBooking")
            )}
          </button>
        </div>
      </div>

      {/* ── Time Picker Bottom Sheet ─────────────────────────── */}
      {showTimePicker && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowTimePicker(false)} />
          <div className="relative bg-white rounded-t-3xl px-5 pt-5 pb-[calc(env(safe-area-inset-bottom,16px)+8px)] max-h-[70vh] flex flex-col animate-slideUp">
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            {/* ── Mode Tabs ── */}
            <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
              <button
                onClick={() => setTimeMode('available')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  timeMode === 'available'
                    ? 'bg-white text-violet-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {translate("nextSchedule")}
              </button>
              <button
                onClick={() => setTimeMode('custom')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  timeMode === 'custom'
                    ? 'bg-white text-violet-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {translate("customTime")}
              </button>
            </div>

            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[17px] font-bold text-gray-900">
                {timeMode === 'available' ? translate("nextSchedule") : translate("customTime")}
              </h3>
              <p className="text-xs text-gray-500">{todayFormatted}</p>
            </div>

            <div className="flex-1 overflow-y-auto -mx-5 px-5">
              {timeMode === 'available' ? (
                /* ═══ Next Schedule: show single next available slot ═══ */
                availableSlots.length === 0 ? (
                  <div className="text-center py-10">
                    <Clock size={28} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-sm font-medium text-gray-500">{translate("noSlotsToday")}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-6 px-2">
                    <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
                      <Clock size={32} className="text-violet-600" />
                    </div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      {translate("nextAvailable")}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mb-1">{availableSlots[0]}</p>
                    <p className="text-xs text-gray-400 mb-6">{todayFormatted}</p>
                    <button
                      onClick={() => { setSelectedTime(availableSlots[0]); setShowTimePicker(false); }}
                      className="w-full max-w-[200px] h-12 rounded-2xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 active:bg-violet-800 transition-all shadow-md shadow-violet-200 flex items-center justify-center gap-2"
                    >
                      <Check size={16} />
                      {translate("select")} {availableSlots[0]}
                    </button>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center py-4">
                  {/* Shop hours indicator */}
                  <div className="text-xs text-gray-400 mb-3 flex items-center gap-1.5">
                    <Clock size={12} />
                    {translate("shopHours")} {shopHours.openTimeStr} — {shopHours.closeTimeStr}
                  </div>

                  {/* Big time display with steppers */}
                  <div className="flex items-center gap-3 mb-6">
                    {/* Hours */}
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => {
                          const newH = customHour === 12 ? 1 : customHour + 1;
                          const newMins = customTimeToMinutes(newH, customMinute, customAmPm);
                          const latestStart = shopHours.closeMinutes - totalDuration;
                          if (newMins >= shopHours.openMinutes && newMins + totalDuration <= shopHours.closeMinutes) {
                            setCustomHour(newH);
                          }
                        }}
                        className="w-16 h-10 flex items-center justify-center text-gray-400 hover:text-violet-600 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                      >
                        <ChevronUp size={24} />
                      </button>
                      {editingType === 'hour' ? (
                        <input
                          ref={editInputRef}
                          type="number"
                          min={1}
                          max={12}
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingType(null); }}
                          className={`w-20 h-16 rounded-2xl flex items-center justify-center text-4xl font-bold text-center outline-none ${
                            isCustomTimeValid ? 'bg-violet-50 text-violet-700' : 'bg-red-50 text-red-400'
                          }`}
                          style={{ caretColor: '#7c3aed' }}
                        />
                      ) : (
                        <div
                          onMouseDown={e => handleDigitPointerDown('hour', e)}
                          onTouchStart={e => handleDigitPointerDown('hour', e)}
                          className={`w-20 h-16 rounded-2xl flex items-center justify-center text-4xl font-bold select-none cursor-pointer transition-colors active:scale-95 ${
                            isCustomTimeValid ? 'bg-violet-50 text-violet-700 active:bg-violet-100' : 'bg-red-50 text-red-400 active:bg-red-100'
                          }`}
                        >
                          {customHour.toString().padStart(2, '0')}
                        </div>
                      )}
                      <button
                        onClick={() => {
                          const newH = customHour === 1 ? 12 : customHour - 1;
                          const newMins = customTimeToMinutes(newH, customMinute, customAmPm);
                          const latestStart = shopHours.closeMinutes - totalDuration;
                          if (newMins >= shopHours.openMinutes && newMins + totalDuration <= shopHours.closeMinutes) {
                            setCustomHour(newH);
                          }
                        }}
                        className="w-16 h-10 flex items-center justify-center text-gray-400 hover:text-violet-600 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                      >
                        <ChevronDown size={24} />
                      </button>
                    </div>

                    <span className="text-4xl font-bold text-gray-300 mt-8">:</span>

                    {/* Minutes */}
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => {
                          const newM = customMinute === 59 ? 0 : customMinute + 1;
                          const newMins = customTimeToMinutes(customHour, newM, customAmPm);
                          const latestStart = shopHours.closeMinutes - totalDuration;
                          if (newMins >= shopHours.openMinutes && newMins + totalDuration <= shopHours.closeMinutes) {
                            setCustomMinute(newM);
                          }
                        }}
                        className="w-16 h-10 flex items-center justify-center text-gray-400 hover:text-violet-600 transition-colors"
                      >
                        <ChevronUp size={24} />
                      </button>
                      {editingType === 'minute' ? (
                        <input
                          ref={editInputRef}
                          type="number"
                          min={0}
                          max={59}
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingType(null); }}
                          className={`w-20 h-16 rounded-2xl flex items-center justify-center text-4xl font-bold text-center outline-none ${
                            isCustomTimeValid ? 'bg-violet-50 text-violet-700' : 'bg-red-50 text-red-400'
                          }`}
                          style={{ caretColor: '#7c3aed' }}
                        />
                      ) : (
                        <div
                          onMouseDown={e => handleDigitPointerDown('minute', e)}
                          onTouchStart={e => handleDigitPointerDown('minute', e)}
                          className={`w-20 h-16 rounded-2xl flex items-center justify-center text-4xl font-bold select-none cursor-pointer transition-colors active:scale-95 ${
                            isCustomTimeValid ? 'bg-violet-50 text-violet-700 active:bg-violet-100' : 'bg-red-50 text-red-400 active:bg-red-100'
                          }`}
                        >
                          {customMinute.toString().padStart(2, '0')}
                        </div>
                      )}
                      <button
                        onClick={() => {
                          const newM = customMinute === 0 ? 59 : customMinute - 1;
                          const newMins = customTimeToMinutes(customHour, newM, customAmPm);
                          const latestStart = shopHours.closeMinutes - totalDuration;
                          if (newMins >= shopHours.openMinutes && newMins + totalDuration <= shopHours.closeMinutes) {
                            setCustomMinute(newM);
                          }
                        }}
                        className="w-16 h-10 flex items-center justify-center text-gray-400 hover:text-violet-600 transition-colors"
                      >
                        <ChevronDown size={24} />
                      </button>
                    </div>
                  </div>

                  {/* AM / PM Toggle */}
                  <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
                    <button
                      onClick={() => {
                        const newMins = customTimeToMinutes(customHour, customMinute, 'AM');
                        const latestStart = shopHours.closeMinutes - totalDuration;
                        if (newMins >= shopHours.openMinutes && newMins + totalDuration <= shopHours.closeMinutes) {
                          setCustomAmPm('AM');
                        }
                      }}
                      className={`px-8 py-2 text-sm font-semibold rounded-lg transition-all ${
                        customAmPm === 'AM'
                          ? 'bg-white text-violet-700 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      AM
                    </button>
                    <button
                      onClick={() => {
                        const newMins = customTimeToMinutes(customHour, customMinute, 'PM');
                        const latestStart = shopHours.closeMinutes - totalDuration;
                        if (newMins >= shopHours.openMinutes && newMins + totalDuration <= shopHours.closeMinutes) {
                          setCustomAmPm('PM');
                        }
                      }}
                      className={`px-8 py-2 text-sm font-semibold rounded-lg transition-all ${
                        customAmPm === 'PM'
                          ? 'bg-white text-violet-700 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      PM
                    </button>
                  </div>

                  {/* Quick minute snaps */}
                  <div className="flex gap-2 mb-6">
                    {['00', '15', '30', '45'].map(m => {
                      const snapMin = parseInt(m);
                      const snapMins = customTimeToMinutes(customHour, snapMin, customAmPm);
                      const latestStart = shopHours.closeMinutes - totalDuration;
                      const isSnapValid = snapMins >= shopHours.openMinutes && snapMins + totalDuration <= shopHours.closeMinutes;
                      return (
                        <button
                          key={m}
                          onClick={() => isSnapValid && setCustomMinute(snapMin)}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                            !isSnapValid
                              ? 'bg-gray-50 text-gray-300 border border-gray-100 cursor-not-allowed'
                              : customMinute === snapMin
                                ? 'bg-violet-50 text-violet-700 border border-violet-200'
                                : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-violet-300 hover:text-violet-600'
                          }`}
                        >
                          :{m}
                        </button>
                      );
                    })}
                  </div>

                  {/* Out-of-range warning */}
                  {!isCustomTimeValid && (
                    <div className="text-xs text-red-500 bg-red-50 rounded-xl px-4 py-2.5 mb-3 flex items-center gap-2">
                      <X size={14} />
                      <span>{translate("customTimeOutsideRange").replace('{open}', shopHours.openTimeStr).replace('{close}', shopHours.closeTimeStr)}</span>
                    </div>
                  )}

                  {/* Live availability status */}
                  {isCustomTimeValid && customStatus !== 'idle' && (
                    customStatus === 'checking' ? (
                      <div className="text-xs text-gray-500 bg-gray-50 rounded-xl px-4 py-2.5 mb-3 flex items-center justify-center gap-2">
                        <Loader2 size={14} className="animate-spin" />
                        <span>{translate("checkingAvailability")}</span>
                      </div>
                    ) : customStatus === 'available' ? (
                      <div className="text-xs text-emerald-700 bg-emerald-50 rounded-xl px-4 py-2.5 mb-3 flex items-center justify-center gap-2">
                        <Check size={14} />
                        <span>{translate("timeAvailable")}</span>
                      </div>
                    ) : (
                      <div className="text-xs text-red-600 bg-red-50 rounded-xl px-4 py-2.5 mb-3">
                        <div className="flex items-center justify-center gap-2">
                          <X size={14} />
                          <span>{customUnavailableReason === 'past' ? translate("timePassed") : translate("timeAlreadyBooked")}</span>
                        </div>
                        {customNextAvailable && (
                          <button
                            onClick={() => {
                              const m = customNextAvailable.match(/(\d+):(\d+)\s*(AM|PM)/i);
                              if (m) {
                                setCustomHour(parseInt(m[1], 10));
                                setCustomMinute(parseInt(m[2], 10));
                                setCustomAmPm(m[3].toUpperCase() as 'AM' | 'PM');
                              }
                            }}
                            className="mt-2 w-full inline-flex items-center justify-center gap-1.5 font-semibold text-violet-700 hover:text-violet-800 active:text-violet-900 transition-colors"
                          >
                            <ChevronUp size={13} />
                            {translate("useNextAvailable")} — {customNextAvailable}
                          </button>
                        )}
                      </div>
                    )
                  )}

                  {/* Select Button */}
                  <button
                    onClick={() => {
                      if (!isCustomTimeValid || customStatus !== 'available') return;
                      const time = formatCustomTime(customHour, customMinute, customAmPm);
                      setSelectedTime(time);
                      setShowTimePicker(false);
                    }}
                    disabled={!isCustomTimeValid || customStatus !== 'available'}
                    className={`w-full max-w-[240px] h-12 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                      isCustomTimeValid && customStatus === 'available'
                        ? 'bg-violet-600 text-white hover:bg-violet-700 active:bg-violet-800 shadow-violet-200'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isCustomTimeValid && customStatus === 'available' ? (
                      <>
                        <Check size={16} />
                        {translate("select")} {formatCustomTime(customHour, customMinute, customAmPm)}
                      </>
                    ) : isCustomTimeValid && customStatus !== 'unavailable' ? (
                      <><Loader2 size={16} className="animate-spin" /> {translate("checkingAvailability")}</>
                    ) : (
                      <>{translate("unavailable")}</>
                    )}
                  </button>
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
            // Move straight into the locked session screen
            router.push("/session");
          }}
        />
      )}
    </div>
  );
}
