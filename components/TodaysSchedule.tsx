"use client";

import { useState, useEffect } from "react";
import { Clock, Check, X, Loader2, Timer } from "lucide-react";
import { updateBookingStatus } from "@/app/actions/bookings";
import { useRouter } from "next/navigation";
import { getScheduleInfo, getOvertimeInfo, formatOvertime } from "@/lib/timeUtils";


export function TodaysSchedule({ initialBookings }: { initialBookings: any[] }) {
    const [bookings, setBookings] = useState(initialBookings);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [cancelModalId, setCancelModalId] = useState<string | null>(null);
    const [, setTick] = useState(0);
    const router = useRouter();
    
    useEffect(() => {
        setBookings(initialBookings);
    }, [initialBookings]);

    useEffect(() => {
        // Update countdown and overtime timer every second
        const interval = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    const handleComplete = async (id: string) => {
        setProcessingId(id);
        const result = await updateBookingStatus(id, 'completed');
        
        if (result.success) {
            setBookings(prev => prev.filter(b => b.id !== id));
            router.refresh();
        } else {
            alert("Failed to update: " + result.error);
        }
        setProcessingId(null);
    };

    const handleConfirmCancel = async () => {
        if (!cancelModalId) return;
        setProcessingId(cancelModalId);
        
        const result = await updateBookingStatus(cancelModalId, 'cancelled');
        
        if (result.success) {
            setBookings(prev => prev.filter(b => b.id !== cancelModalId));
            router.refresh();
        } else {
            alert("Failed to cancel: " + result.error);
        }
        setProcessingId(null);
        setCancelModalId(null);
    };

    if (bookings.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                No appointments scheduled for today.
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
            {bookings.map((booking: any) => {
                const servicesList = booking.services && booking.services.length > 0 
                                      ? booking.services.map((s: any) => s.name).join(", ") 
                                      : booking.service?.name || "Unknown Service";
                
                const totalDuration = booking.services && booking.services.length > 0 
                                      ? booking.services.reduce((acc: number, curr: any) => acc + (parseInt(curr.duration, 10) || 30), 0)
                                      : parseInt(booking.service?.duration || 30, 10);
                                      
                const { text: countdown, hasStarted } = getScheduleInfo(booking.slotDate, booking.slotStartTime);
                const { isOvertime, overtimeSeconds } = getOvertimeInfo(booking.slotDate, booking.slotStartTime, totalDuration);

                return (
                    <div key={booking.id} className={`p-4 rounded-xl border transition-colors ${
                      isOvertime 
                        ? "border-red-200 bg-red-50" 
                        : "border-gray-100 bg-gray-50 hover:border-indigo-200"
                    }`}>
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <p className="font-bold text-gray-900">{booking.user?.name || "Unknown Client"}</p>
                                <p className="text-sm text-gray-600 mt-0.5 truncate max-w-[200px] lg:max-w-[300px]">
                                    {servicesList} ({totalDuration} mins)
                                </p>
                            </div>
                            <div className="text-right">
                                <div className={`font-bold px-3 py-1 rounded-md inline-flex items-center gap-1.5 border ${
                                  isOvertime
                                    ? "text-red-600 bg-red-50 border-red-200"
                                    : "text-indigo-600 bg-indigo-50 border-indigo-100"
                                }`}>
                                    <Clock size={14} />
                                    {booking.slotStartTime}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                            {isOvertime ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-100 px-2.5 py-1 rounded-md animate-pulse">
                                <Timer size={14} className="text-red-500" />
                                Over Time • {formatOvertime(overtimeSeconds)}
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                  {countdown}
                              </span>
                            )}
                            
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => handleComplete(booking.id)}
                                    disabled={processingId === booking.id || !hasStarted}
                                    className="px-3 py-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {processingId === booking.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                    Complete
                                </button>
                                {!hasStarted && (
                                    <button 
                                        onClick={() => setCancelModalId(booking.id)}
                                        disabled={processingId === booking.id}
                                        className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <X size={14} />
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
            
            {cancelModalId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Cancel Booking?</h3>
                        <p className="text-sm text-gray-600 mb-6">Are you sure you want to cancel this booking? The client will be notified immediately.</p>
                        
                        <div className="flex items-center gap-3 w-full">
                            <button 
                                onClick={() => setCancelModalId(null)}
                                disabled={processingId === cancelModalId}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                                Keep it
                            </button>
                            <button 
                                onClick={handleConfirmCancel}
                                disabled={processingId === cancelModalId}
                                className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                            >
                                {processingId === cancelModalId ? <Loader2 size={16} className="animate-spin" /> : null}
                                Confirm Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
