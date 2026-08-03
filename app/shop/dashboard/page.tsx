"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Clock, Check, X, Loader2, CalendarCheck, Scissors, Timer, Phone, UserX } from "lucide-react";
import { SkeletonBookingCard } from "@/components/Skeleton";
import { getShopBookings, updateBookingStatus } from "@/app/actions/bookings";
import { getKolkataDateString, getScheduleInfo, getOvertimeInfo, formatOvertime } from "@/lib/timeUtils";
import { useLanguage } from "@/components/LanguageContext";
import { UserAvatar } from "@/components/UserAvatar";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";

export default function ShopDashboard() {
  const { translate } = useLanguage();
  const [todaysBookings, setTodaysBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [cancelModalId, setCancelModalId] = useState<string | null>(null);
  const [noShowModalId, setNoShowModalId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [todayStr, setTodayStr] = useState(() => getKolkataDateString());
  const [rawBookings, setRawBookings] = useState<any[] | null>(null);
  const autoCompletedRef = useRef<Set<string>>(new Set());

  // Refresh countdown and overtime timer every second
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Keep today's date fresh so the list rolls over at midnight without a refresh
  useEffect(() => {
    const interval = setInterval(() => setTodayStr(getKolkataDateString()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto-complete any booking whose overtime exceeded 15 minutes.
  // The 1-second tick keeps this check live without extra refetches; each id
  // is only completed once thanks to autoCompletedRef.
  useEffect(() => {
    todaysBookings.forEach((booking: any) => {
      if (autoCompletedRef.current.has(booking.id)) return;
      const servicesList =
        booking.services && booking.services.length > 0
          ? booking.services
          : [booking.service];
      const totalDuration = servicesList.reduce(
        (acc: number, s: any) => acc + (parseInt(s?.duration, 10) || 30),
        0
      ) || 30;
      const { isOvertime, overtimeSeconds } = getOvertimeInfo(
        booking.slotDate,
        booking.slotStartTime,
        totalDuration
      );
      if (isOvertime && overtimeSeconds > 15 * 60) {
        autoCompletedRef.current.add(booking.id);
        updateBookingStatus(booking.id, "completed").then((result) => {
          if (result.success) {
            setTodaysBookings((prev) => prev.filter((b) => b.id !== booking.id));
          } else {
            autoCompletedRef.current.delete(booking.id);
          }
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todaysBookings, tick]);

  // Fetch the enriched booking list (user + service details) from the server action
  const fetchBookings = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const allBookings = await getShopBookings();
      setRawBookings(allBookings);
    } catch (error) {
      console.error("Failed to fetch today's bookings:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filter raw bookings down to today's confirmed/pending appointments
  useEffect(() => {
    if (!rawBookings) return;
    const filtered = rawBookings.filter(
      (b: any) =>
        b.slotDate === todayStr &&
        (b.status === "confirmed" || b.status === "pending") &&
        b.slotStartTime // Make sure slotStartTime exists to prevent render crash
    );
    setTodaysBookings(filtered);
  }, [rawBookings, todayStr]);

  // Resolve the shop and keep the schedule realtime via a Firestore listener.
  // The first snapshot performs the initial (loading) fetch; every later
  // snapshot — e.g. a client booking a slot — refetches in the background so
  // the new card appears instantly without refreshing the page.
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) return;
      let cancelled = false;
      let unsubBookings: (() => void) | null = null;

      (async () => {
        try {
          const shopQ = query(collection(db, "shops"), where("ownerId", "==", user.uid));
          const shopSnap = await getDocs(shopQ);
          if (shopSnap.empty) {
            setIsLoading(false);
            return;
          }
          const shopId = shopSnap.docs[0].id;

          let isFirst = true;
          const bookingsQ = query(collection(db, "bookings"), where("shopId", "==", shopId));
          if (cancelled) return;
          unsubBookings = onSnapshot(bookingsQ, () => {
            fetchBookings(isFirst);
            isFirst = false;
          });
        } catch (error) {
          console.error("Failed to resolve shop:", error);
          setIsLoading(false);
        }
      })();

      return () => {
        cancelled = true;
        unsubBookings?.();
      };
    });

    return () => unsubAuth();
  }, [fetchBookings]);

  const handleComplete = async (id: string) => {
    setProcessingId(id);
    const result = await updateBookingStatus(id, "completed");
    if (result.success) {
      setTodaysBookings((prev) => prev.filter((b) => b.id !== id));
    } else {
      alert("Failed to update: " + result.error);
    }
    setProcessingId(null);
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalId) return;
    setProcessingId(cancelModalId);
    const result = await updateBookingStatus(cancelModalId, "cancelled");
    if (result.success) {
      setTodaysBookings((prev) => prev.filter((b) => b.id !== cancelModalId));
    } else {
      alert("Failed to cancel: " + result.error);
    }
    setProcessingId(null);
    setCancelModalId(null);
  };

  // Mark a started appointment as a no-show: the client never arrived, so the
  // booking ends and shows up as cancelled on the client's locked session screen.
  const handleConfirmNoShow = async () => {
    if (!noShowModalId) return;
    setProcessingId(noShowModalId);
    const result = await updateBookingStatus(noShowModalId, "no_show");
    if (result.success) {
      setTodaysBookings((prev) => prev.filter((b) => b.id !== noShowModalId));
    } else {
      alert("Failed to mark as not arrive: " + result.error);
    }
    setProcessingId(null);
    setNoShowModalId(null);
  };

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h} hr`;
    return `${m} min`;
  };

  return (
    <div className="space-y-5">
      {/* Today's Schedule Section */}
      <div>
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-violet-600" />
            <h2 className="text-[17px] font-bold text-gray-900">{translate("todaysSchedule")}</h2>
          </div>
          <span className="text-xs font-semibold bg-violet-100 text-violet-700 px-3 py-1.5 rounded-full">
            {todaysBookings.length} {translate("upcoming")}
          </span>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="space-y-3.5">
            {[1, 2, 3].map((i) => <SkeletonBookingCard key={i} />)}
          </div>
        ) : todaysBookings.length === 0 ? (
          /* Empty State - Premium */
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-violet-50 flex items-center justify-center mx-auto mb-4">
              <CalendarCheck size={28} className="text-violet-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No appointments scheduled for today.</h3>
            <p className="text-sm text-gray-500">Once clients book, they&apos;ll appear here.</p>
          </div>
        ) : (
          /* Appointment Cards */
          <div className="space-y-3.5">
            {todaysBookings.map((booking: any) => {
              const servicesList =
                booking.services && booking.services.length > 0
                  ? booking.services.map((s: any) => s.name)
                  : [booking.service?.name || "Service"];

              const totalDuration =
                booking.services && booking.services.length > 0
                  ? booking.services.reduce(
                      (acc: number, curr: any) => acc + (parseInt(curr.duration, 10) || 30),
                      0
                    )
                  : parseInt(booking.service?.duration || 30, 10);

              const { text: countdown, hasStarted } = getScheduleInfo(
                booking.slotDate,
                booking.slotStartTime
              );
              const { isOvertime, overtimeSeconds } = getOvertimeInfo(
                booking.slotDate,
                booking.slotStartTime,
                totalDuration
              );

              return (
                <div
                  key={booking.id}
                  className={`bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden active:scale-[0.99] transition-transform ${
                    isOvertime ? "border-2 border-red-300" : "border border-gray-50"
                  }`}
                >
                  <div className="p-4 space-y-3">
                    {/* ═══ ROW 1: User Name + Avatar | Call icon + Scheduled Time ═══ */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar
                          user={booking.user}
                          className="w-10 h-10 rounded-full ring-2 ring-white shadow-sm"
                          fallbackClassName="bg-violet-100 text-violet-700 font-bold text-sm"
                        />
                        <p className="text-[15px] font-bold text-gray-900 truncate">
                          {booking.user?.name || "Unknown Client"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Call icon — dashboard only lists active (booked)
                            schedules, so this is naturally hidden once the
                            service is completed/cancelled. */}
                        {booking.user?.phone && (
                          <a
                            href={`tel:${booking.user.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200 hover:text-emerald-700 active:scale-90 transition-all flex items-center justify-center shrink-0"
                            title={`Call ${booking.user.name || "client"} at ${booking.user.phone}`}
                          >
                            <Phone size={15} />
                          </a>
                        )}
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-violet-700 bg-violet-50 px-3 py-1.5 rounded-xl">
                          <Clock size={14} />
                          {booking.slotStartTime}
                        </div>
                      </div>
                    </div>

                    {/* ═══ ROW 2: Services Count | Total Duration | Countdown ═══ */}
                    <div className="flex items-center justify-center gap-4 bg-gray-50 rounded-xl px-3.5 py-2.5">
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Scissors size={13} className="text-gray-400" />
                        <span className="font-semibold text-gray-800">{servicesList.length}</span>
                        <span className="text-gray-500">service{servicesList.length > 1 ? "s" : ""}</span>
                      </div>
                      <div className="w-px h-4 bg-gray-200" />
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Timer size={13} className="text-gray-400" />
                        <span className="font-semibold text-gray-800">{formatDuration(totalDuration)}</span>
                      </div>
                      <div className="w-px h-4 bg-gray-200" />
                      {isOvertime ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-100 px-2.5 py-1 rounded-full animate-pulse">
                          <Timer size={13} className="text-red-500" />
                          Over Time • {formatOvertime(overtimeSeconds)}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-violet-700">
                          {countdown}
                        </span>
                      )}
                    </div>

                    {/* ═══ ROW 3: Complete / Not Arrive / Cancel Buttons ═══ */}
                    {hasStarted ? (
                      <div className="flex gap-2.5">
                        <button
                          onClick={() => handleComplete(booking.id)}
                          disabled={processingId === booking.id}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 active:bg-violet-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-violet-200"
                        >
                          {processingId === booking.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Check size={16} />
                          )}
                          {processingId === booking.id ? translate("completing") : translate("completeAppointment")}
                        </button>
                        <button
                          onClick={() => setNoShowModalId(booking.id)}
                          disabled={processingId === booking.id}
                          title="Client did not arrive"
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-amber-300 bg-amber-50 text-amber-700 text-sm font-semibold hover:bg-amber-100 active:bg-amber-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingId === booking.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <UserX size={16} />
                          )}
                          {processingId === booking.id ? translate("markingNotArrive") : translate("markNotArrive")}
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2.5">
                        <button
                          onClick={() => handleComplete(booking.id)}
                          disabled={true}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gray-200 text-gray-500 text-sm font-semibold cursor-not-allowed transition-all shadow-none"
                        >
                          <Check size={16} />
                          Complete
                        </button>
                        <button
                          onClick={() => setCancelModalId(booking.id)}
                          disabled={processingId === booking.id}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 active:bg-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <X size={16} />
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Not Arrive Confirmation Modal */}
      {noShowModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <UserX size={22} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">{translate("notArriveConfirmTitle")}</h3>
            <p className="text-sm text-gray-600 text-center mb-6">{translate("notArriveConfirmMsg")}</p>
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => setNoShowModalId(null)}
                disabled={processingId === noShowModalId}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm"
              >
                Keep it
              </button>
              <button
                onClick={handleConfirmNoShow}
                disabled={processingId === noShowModalId}
                className="flex-1 px-4 py-2.5 bg-amber-600 text-white font-medium rounded-xl hover:bg-amber-700 transition-colors flex justify-center items-center gap-2 disabled:opacity-50 text-sm"
              >
                {processingId === noShowModalId ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <UserX size={16} />
                )}
                {processingId === noShowModalId ? translate("markingNotArrive") : translate("markNotArrive")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-fadeIn">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Cancel Booking?</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to cancel this booking? The client will be notified immediately.
            </p>
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => setCancelModalId(null)}
                disabled={processingId === cancelModalId}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm"
              >
                Keep it
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={processingId === cancelModalId}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors flex justify-center items-center gap-2 disabled:opacity-50 text-sm"
              >
                {processingId === cancelModalId ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : null}
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
