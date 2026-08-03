"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export function ClientNotificationProvider() {
    const [toasts, setToasts] = useState<{id: string, message: string}[]>([]);

    const addToast = (message: string) => {
        const id = Math.random().toString(36).substring(7);
        setToasts(prev => [...prev, { id, message }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 10000); // 10 seconds for client cancellations to ensure they see it
    };

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                const bookingsQ = query(collection(db, "bookings"), where("userId", "==", user.uid));
                let isInitialRender = true;
                
                const unsubscribeBookings = onSnapshot(bookingsQ, (snapshot) => {
                    if (isInitialRender) {
                        isInitialRender = false;
                        return;
                    }
                    
                    snapshot.docChanges().forEach((change) => {
                        if (change.type === "modified") {
                            const b = change.doc.data();
                            if (b.status === "cancelled" || b.status === "no_show") {
                                addToast(`Your booking on ${b.slotDate} at ${b.slotStartTime} has been cancelled by the shop.`);
                            }
                        }
                    });
                });
                
                return () => unsubscribeBookings();
            }
        });
        return () => unsubscribeAuth();
    }, []);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2">
            {toasts.map(toast => (
                <div key={toast.id} className="px-6 py-4 rounded-xl shadow-lg border text-sm font-medium animate-in slide-in-from-right-5 fade-in duration-300 flex items-center gap-3 min-w-[300px] bg-red-50 text-red-800 border-red-200">
                    {toast.message}
                </div>
            ))}
        </div>
    );
}
