"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getActiveSession } from "@/app/actions/client";
import { useLanguage } from "@/components/LanguageContext";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { Scissors, Clock, Lock, Check, X, Loader2, Phone, MapPin } from "lucide-react";
import { SafeImage } from "@/components/SafeImage";
import { motion, AnimatePresence } from "framer-motion";

// ─── Helpers ─────────────────────────────────────────────────────
function parseTimeToMinutes(timeStr: string): number {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = match[3]?.toUpperCase();
  if (ampm === "PM" && h < 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

function formatDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function formatClock(mins: number) {
  const h24 = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const ampm = h24 >= 12 ? "PM" : "AM";
  const h = h24 % 12 || 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
}

// Remaining ms until slotStartTime + totalDuration (IST wall-clock based,
// same technique as lib/timeUtils — timezone-independent difference).
function getRemainingMs(slotDate: string, slotStartTime: string, duration: number): number {
  const nowStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const now = new Date(nowStr);
  const startMins = parseTimeToMinutes(slotStartTime);
  const endMins = startMins + duration;
  const endH = Math.floor(endMins / 60);
  const endM = endMins % 60;
  const [y, mo, d] = slotDate.split("-").map(Number);
  let end = new Date(y, mo - 1, d, endH, endM, 0, 0);
  // Roll over to the next day if the service crosses midnight
  if (end.getTime() < now.getTime()) end = new Date(end.getTime() + 24 * 3600 * 1000);
  return Math.max(0, end.getTime() - now.getTime());
}

// Remaining ms until the booked start time (drives the waiting → live switch).
function getRemainingMsUntilStart(slotDate: string, slotStartTime: string): number {
  const nowStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const now = new Date(nowStr);
  const startMins = parseTimeToMinutes(slotStartTime);
  const [y, mo, d] = slotDate.split("-").map(Number);
  const start = new Date(y, mo - 1, d, Math.floor(startMins / 60), startMins % 60, 0, 0);
  return start.getTime() - now.getTime();
}

function formatCountdown(ms: number) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return {
    h: h.toString().padStart(2, "0"),
    m: m.toString().padStart(2, "0"),
    s: s.toString().padStart(2, "0"),
  };
}

// ─── Shared building blocks ───────────────────────────────────────

// Shop logo + name + status badge (UPCOMING before start, LIVE after).
function SessionHeader({ session, live }: { session: any; live: boolean }) {
  const { translate } = useLanguage();
  return (
    <div className="w-full max-w-sm flex items-center justify-between mb-6">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0 overflow-hidden">
          <SafeImage
            src={session.shop?.logoUrl}
            alt={session.shop?.shopName || ""}
            className="w-full h-full object-cover notranslate"
            fallback={<Scissors size={18} className="text-violet-200" />}
          />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-violet-300 font-semibold">
            {live ? translate("sessionInProgress") : translate("appointmentUpcoming")}
          </p>
          <h1 className="notranslate text-base font-bold truncate">{session.shop?.shopName || "Barber Shop"}</h1>
        </div>
      </div>
      {live ? (
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300 bg-emerald-400/10 border border-emerald-300/20 rounded-full px-3 py-1 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          LIVE
        </span>
      ) : (
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-violet-300 bg-violet-400/10 border border-violet-300/20 rounded-full px-3 py-1 shrink-0">
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          {translate("appointmentUpcoming")}
        </span>
      )}
    </div>
  );
}

// Booked services summary card (shared between waiting + live states).
function ServicesCard({ session }: { session: any }) {
  const { translate } = useLanguage();
  return (
    <div className="w-full max-w-sm bg-white/[0.08] backdrop-blur-xl border border-white/10 rounded-3xl p-5 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Scissors size={14} className="text-violet-300" />
        <h3 className="text-[11px] uppercase tracking-widest text-violet-200 font-semibold">{translate("bookedServices")}</h3>
      </div>
      <div className="space-y-3">
        {session.services.map((s: any) => (
          <div key={s.id} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Clock size={14} className="text-violet-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="notranslate text-sm font-semibold truncate">{s.name}</p>
              <p className="text-[11px] text-violet-200/70">{formatDuration(parseInt(s.duration, 10) || 30)}</p>
            </div>
            <span className="text-sm font-bold notranslate">₹{Number(s.price).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
        <span className="text-xs text-violet-200/70">{translate("total")}</span>
        <div className="text-right">
          <p className="text-[11px] text-violet-200/70">{formatDuration(session.totalDuration)}</p>
          <p className="text-base font-bold notranslate">₹{Number(session.totalPrice).toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}

// Bottom bar: icon-only actions — tap-to-call phone + Google Maps (opens externally).
function ShopContactBar({ shop }: { shop: any }) {
  const { translate } = useLanguage();
  if (!shop?.phone && !shop?.googleMapLink) return null;
  return (
    <div className="w-full max-w-sm mb-5 flex items-center justify-center gap-3">
      {shop.phone && (
        <a
          href={`tel:${shop.phone}`}
          title={translate("callShop")}
          className="w-12 h-12 rounded-2xl bg-white/[0.08] border border-white/10 backdrop-blur-xl flex items-center justify-center text-white hover:bg-white/[0.14] hover:scale-105 active:scale-95 transition-all shrink-0"
        >
          <Phone size={19} className="text-violet-300" />
        </a>
      )}
      {shop.googleMapLink && (
        <a
          href={shop.googleMapLink}
          target="_blank"
          rel="noopener noreferrer"
          title={translate("openInMaps")}
          className="w-12 h-12 rounded-2xl bg-white/[0.08] border border-white/10 backdrop-blur-xl flex items-center justify-center text-white hover:bg-white/[0.14] hover:scale-105 active:scale-95 transition-all shrink-0"
        >
          <MapPin size={19} className="text-violet-300" />
        </a>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// LOCKED SESSION SCREEN
// ═══════════════════════════════════════════════════════════════════
export default function SessionPage() {
  const router = useRouter();
  const { translate } = useLanguage();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [remainingMs, setRemainingMs] = useState(0);
  const [ended, setEnded] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const unsubBookingsRef = useRef<(() => void) | null>(null);

  const beforeUnloadRef = useRef<((e: BeforeUnloadEvent) => void) | null>(null);
  const popStateRef = useRef<(() => void) | null>(null);

  const unlock = useCallback(() => {
    if (beforeUnloadRef.current) {
      window.removeEventListener("beforeunload", beforeUnloadRef.current);
      beforeUnloadRef.current = null;
    }
    if (popStateRef.current) {
      window.removeEventListener("popstate", popStateRef.current);
      popStateRef.current = null;
    }
  }, []);

  // Load the active booking
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await getActiveSession();
      if (cancelled) return;
      if (!res.hasActive || !res.session) {
        router.replace("/explore");
        return;
      }
      setSession(res.session);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [router]);

  // Live countdown — ticks every second until the schedule ends
  useEffect(() => {
    if (!session || ended) return;
    const tick = () => {
      const rem = getRemainingMs(session.slotDate, session.slotStartTime, session.totalDuration);
      setRemainingMs(rem);
      if (rem <= 0) {
        unlock(); // remove the beforeunload trap immediately, no race
        setEnded(true);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session, ended, unlock]);

  // If the shop cancels OR completes the booking mid-session, unlock right away.
  // "completed" fires when the shop owner taps Complete — the "Session in
  // progress" screen ends immediately with the same completion animation as
  // the countdown naturally finishing.
  useEffect(() => {
    if (!session) return;
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) return;
      unsubBookingsRef.current = onSnapshot(
        doc(db, "bookings", session.id),
        (snap) => {
          const data = snap.data();
          if (data && (data.status === "cancelled" || data.status === "no_show")) {
            unlock(); // remove the beforeunload trap immediately, no race
            setCancelled(true);
            setEnded(true);
          } else if (data && data.status === "completed") {
            unlock(); // remove the beforeunload trap immediately, no race
            setCancelled(false);
            setEnded(true);
          }
        },
        () => {
          // Permission error or doc gone — unlock the user so they're not trapped
          setCancelled(true);
          setEnded(true);
        }
      );
    });
    return () => {
      unsubAuth();
      unsubBookingsRef.current?.();
    };
  }, [session]);

  // ── Lock navigation while the session is live ──────────────
  // Trap the browser back button and block refresh/close.
  useEffect(() => {
    if (!session || ended) return;
    window.history.pushState(null, "", window.location.href);
    const handlePop = () => window.history.pushState(null, "", window.location.href);
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    beforeUnloadRef.current = handleBeforeUnload;
    popStateRef.current = handlePop;
    window.addEventListener("popstate", handlePop);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("popstate", handlePop);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      beforeUnloadRef.current = null;
      popStateRef.current = null;
    };
  }, [session, ended]);

  // Derived values
  const startMins = useMemo(
    () => (session ? parseTimeToMinutes(session.slotStartTime) : 0),
    [session]
  );
  const endMins = startMins + (session?.totalDuration || 0);
  const totalMs = (session?.totalDuration || 0) * 60000;
  const elapsedMs = Math.min(totalMs, Math.max(0, totalMs - remainingMs));
  const progress = totalMs > 0 ? elapsedMs / totalMs : 0;
  const R = 120;
  const CIRC = 2 * Math.PI * R;
  const t = formatCountdown(remainingMs);

  // Waiting → live: recompute each second (remainingMs ticks) so the screen
  // flips to the live countdown the moment the booked time arrives.
  const startMs = useMemo(
    () => (session ? getRemainingMsUntilStart(session.slotDate, session.slotStartTime) : 0),
    [session, remainingMs]
  );
  const started = startMs <= 0;
  const startCountdown = formatCountdown(Math.max(0, startMs));

  if (loading) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-violet-800 via-violet-900 to-purple-950 flex flex-col items-center justify-center text-white">
        <Loader2 size={36} className="animate-spin text-violet-300" />
        <p className="mt-4 text-sm text-violet-200">{translate("loading")}</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-violet-800 via-violet-900 to-purple-950 flex flex-col items-center justify-center text-white px-6">
        <Scissors size={40} className="text-violet-300 mb-4" />          <button
          onClick={() => router.push("/explore")}
          className="h-12 px-8 rounded-2xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 active:bg-violet-800 transition-all"
        >
          {translate("backToExplore")}
        </button>
      </div>
    );
  }

  // ── Session complete / cancelled → unlock ──────────────────
  // AnimatePresence cross-fades the live "Session in progress" screen out and
  // pops the completion card in — used both for the natural countdown end and
  // when the shop owner taps Complete. The waiting → live flip also animates
  // through the same keyed transition.
  return (
    <AnimatePresence mode="wait">
      {ended ? (
        <motion.div
          key="ended"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="min-h-dvh bg-gradient-to-br from-violet-800 via-violet-900 to-purple-950 flex items-center justify-center px-6"
        >
          <div className="bg-white rounded-3xl p-8 mx-4 max-w-sm w-full text-center animate-popIn">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 ${cancelled ? "bg-red-100" : "bg-green-100"}`}>
              {cancelled ? (
                <X size={34} className="text-red-500" />
              ) : (
                <Check size={34} className="text-green-600" strokeWidth={3} />
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {cancelled ? translate("bookingCancelled") : translate("sessionComplete")}
            </h2>
            <p className="text-sm text-gray-500 mb-8">
              {cancelled ? translate("bookingCancelledMsg") : translate("sessionCompleteMsg")}
            </p>
            <button
              onClick={() => router.push("/explore")}
              className="w-full h-12 rounded-2xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 active:bg-violet-800 transition-all"
            >
              {translate("continueExploring")}
            </button>
          </div>
        </motion.div>
      ) : started ? (
        <motion.div
          key="live"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="min-h-dvh bg-gradient-to-br from-violet-800 via-violet-900 to-purple-950 text-white flex flex-col items-center px-5 py-8 overflow-y-auto"
        >
          {/* ── LIVE badge + shop ──────────────────────────── */}
          <SessionHeader session={session} live />

          {/* ── Countdown ring ─────────────────────────────── */}
          <div className="relative w-[260px] h-[260px] mb-3">
            <svg width="260" height="260" viewBox="0 0 260 260" className="-rotate-90">
              <circle cx="130" cy="130" r={R} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="12" />
              <circle
                cx="130"
                cy="130"
                r={R}
                fill="none"
                stroke="url(#sessionGradient)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC * (1 - Math.min(1, Math.max(0, progress)))}
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
              <defs>
                <linearGradient id="sessionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#c4b5fd" />
                  <stop offset="100%" stopColor="#f0abfc" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <p className="text-[10px] uppercase tracking-widest text-violet-300 font-semibold mb-1">
                {translate("sessionEndsIn")}
              </p>
              <p className="text-5xl font-bold tabular-nums tracking-tight notranslate">
                {t.h}:{t.m}:{t.s}
              </p>
              <p className="text-xs text-violet-200/80 mt-2">
                {translate("totalDuration")} <span className="notranslate font-semibold">{formatDuration(session.totalDuration)}</span>
              </p>
            </div>
          </div>

          <p className="text-xs text-violet-200/80 mb-7">
            {session.slotStartTime} → <span className="notranslate font-semibold">{formatClock(endMins)}</span>
          </p>

          {/* ── Booked services ────────────────────────────── */}
          <ServicesCard session={session} />

          {/* ── Shop phone + Google Maps ───────────────────── */}
          <ShopContactBar shop={session.shop} />

          {/* ── Lock note ──────────────────────────────────── */}
          <p className="flex items-center gap-2 text-[11px] text-violet-200/80 pb-6">
            <Lock size={13} className="shrink-0" />
            {translate("lockedNote")}
          </p>
        </motion.div>
      ) : (
        <motion.div
          key="waiting"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="min-h-dvh bg-gradient-to-br from-violet-800 via-violet-900 to-purple-950 text-white flex flex-col items-center px-5 py-8 overflow-y-auto"
        >
          {/* ── UPCOMING badge + shop ──────────────────────── */}
          <SessionHeader session={session} live={false} />

          {/* ── Waiting visual: pulsing rings + scissors ───── */}
          <div className="relative w-[250px] h-[250px] mb-3 flex items-center justify-center">
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-violet-400/25"
              animate={{ scale: [1, 1.12, 1], opacity: [0.7, 0.2, 0.7] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute inset-7 rounded-full border border-violet-300/15"
              animate={{ scale: [1, 1.18, 1], opacity: [0.6, 0.1, 0.6] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            />
            <div className="w-32 h-32 rounded-[2rem] bg-white/[0.08] border border-white/15 backdrop-blur-xl flex flex-col items-center justify-center gap-2 shadow-2xl">
              <motion.div
                animate={{ rotate: [0, -6, 6, 0] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Scissors size={32} className="text-violet-300" />
              </motion.div>
              <p className="text-[9px] uppercase tracking-widest text-violet-300 font-bold">
                {translate("waitingForTurn")}
              </p>
            </div>
          </div>

          {/* ── Starts-at + countdown to start ─────────────── */}
          <p className="text-sm text-violet-200/90 mb-1">{translate("appointmentStartsAt")}</p>
          <p className="text-2xl font-bold notranslate mb-1">{session.slotStartTime}</p>
          <p className="text-xs text-violet-200/70 mb-7">
            {translate("startsIn")}{" "}
            <span className="notranslate font-bold tabular-nums">
              {startCountdown.h}:{startCountdown.m}:{startCountdown.s}
            </span>
          </p>

          {/* ── Booked services ────────────────────────────── */}
          <ServicesCard session={session} />

          {/* ── Shop phone + Google Maps ───────────────────── */}
          <ShopContactBar shop={session.shop} />

          {/* ── Lock note ──────────────────────────────────── */}
          <p className="flex items-center gap-2 text-[11px] text-violet-200/80 pb-6">
            <Lock size={13} className="shrink-0" />
            {translate("lockedNote")}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
