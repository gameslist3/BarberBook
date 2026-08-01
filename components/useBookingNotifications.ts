"use client";

import { useEffect, useRef, useState } from "react";
import { onSnapshot, Query } from "firebase/firestore";

export interface NotifItem {
  id: string; // unique key used for deduplication / "seen" tracking
  title: string;
  message: string;
  time: string;
  type?: "info" | "success" | "danger" | "warning" | "booking";
  meta?: Record<string, any>; // optional structured data for callbacks
}

/**
 * Live booking-notification hook shared by the client, shop-owner and admin
 * headers. Behaviour:
 *  - Only *new* events (added/modified docs) generate notifications — old
 *    bookings that already existed when the page loaded are silently treated
 *    as seen, so users are never flooded with stale history.
 *  - Seen notification ids are persisted to localStorage, so tapping
 *    "Clear all" permanently dismisses them and they never reappear.
 *  - Newest notifications are always prepended (newest first).
 */
export function useBookingNotifications(
  query: Query | null,
  mapper: (data: any, changeType: "added" | "modified", docId: string) => NotifItem | null,
  storageKey: string,
  onNew?: (n: NotifItem) => void
) {
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const seenRef = useRef<Set<string>>(new Set());
  const mapperRef = useRef(mapper);
  mapperRef.current = mapper;
  const onNewRef = useRef(onNew);
  onNewRef.current = onNew;

  // Load previously seen ids so dismissed notifications stay dismissed.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) seenRef.current = new Set(JSON.parse(raw));
    } catch {}
  }, [storageKey]);

  useEffect(() => {
    if (!query) return;
    let isFirst = true;

    const unsubscribe = onSnapshot(
      query,
      (snap) => {
        const newItems: NotifItem[] = [];

        snap.docChanges().forEach((change) => {
          if (change.type === "removed") return;
          const item = mapperRef.current(change.doc.data(), change.type, change.doc.id);
          if (!item) return;

          if (isFirst) {
            // First snapshot = baseline. Mark existing events as seen so old
            // bookings never produce notifications.
            seenRef.current.add(item.id);
            return;
          }
          if (seenRef.current.has(item.id)) return;

          seenRef.current.add(item.id);
          newItems.push(item);
        });

        if (isFirst) {
          isFirst = false;
          try {
            localStorage.setItem(storageKey, JSON.stringify([...seenRef.current]));
          } catch {}
          return;
        }

        if (newItems.length > 0) {
          // Prepend newest first, cap the list.
          setNotifications((prev) => [...newItems.reverse(), ...prev].slice(0, 20));
          newItems.forEach((n) => onNewRef.current?.(n));
          try {
            localStorage.setItem(storageKey, JSON.stringify([...seenRef.current]));
          } catch {}
        }
      },
      (err) => {
        console.warn("Notification listener error:", err.message);
      }
    );

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const clearAll = () => {
    setNotifications((prev) => {
      prev.forEach((n) => seenRef.current.add(n.id));
      try {
        localStorage.setItem(storageKey, JSON.stringify([...seenRef.current]));
      } catch {}
      return [];
    });
  };

  return { notifications, clearAll };
}
