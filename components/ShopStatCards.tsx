"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SkeletonStatCard } from "@/components/Skeleton";

interface Stats {
  totalBookings: number;
  activeServices: number;
  totalClients: number;
  revenue: number;
}

export function ShopStatCards({ shopId }: { shopId: string }) {
  const [stats, setStats] = useState<Stats>({
    totalBookings: 0,
    activeServices: 0,
    totalClients: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shopId) return;

    const bookingsQuery = query(
      collection(db, "bookings"),
      where("shopId", "==", shopId)
    );
    const servicesQuery = query(
      collection(db, "services"),
      where("shopId", "==", shopId)
    );

    let servicesData: any[] = [];
    let bookingsData: any[] = [];
    let servicesReady = false;
    let bookingsReady = false;

    const computeStats = () => {
      if (!servicesReady || !bookingsReady) return;
      setLoading(false);

      const uniqueClients = new Set(bookingsData.map((b: any) => b.userId)).size;

      let totalRevenue = 0;
      const completedBookings = bookingsData.filter((b: any) => b.status === "completed");
      for (const b of completedBookings) {
        const svc = servicesData.filter((s: any) =>
          b.serviceIds?.includes(s.id) || s.id === b.serviceId
        );
        for (const s of svc as any[]) {
          totalRevenue += Number(s.price) || 0;
        }
      }

      setStats({
        totalBookings: bookingsData.length,
        activeServices: servicesData.filter((s: any) => s.isActive !== false).length,
        totalClients: uniqueClients,
        revenue: totalRevenue,
      });
    };

    const unsubscribeServices = onSnapshot(servicesQuery, (snap) => {
      servicesData = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      servicesReady = true;
      computeStats();
    });

    const unsubscribeBookings = onSnapshot(bookingsQuery, (snap) => {
      bookingsData = snap.docs.map((doc) => doc.data());
      bookingsReady = true;
      computeStats();
    });

    return () => {
      unsubscribeServices();
      unsubscribeBookings();
    };
  }, [shopId]);

  const cards = [
    {
      label: "Bookings",
      value: stats.totalBookings,
      href: "/shop/bookings",
    },
    {
      label: "Services",
      value: stats.activeServices,
      href: "/shop/services",
    },
    {
      label: "Clients",
      value: stats.totalClients,
      href: "/shop/bookings",
    },
    {
      label: "Revenue",
      value: `₹${stats.revenue.toFixed(0)}`,
      href: "/shop/dashboard",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-2.5 mb-5">
        {[1, 2, 3, 4].map((i) => <SkeletonStatCard key={i} />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2.5 mb-5">
      {cards.map((card, i) => (
        <Link
          key={i}
          href={card.href}
          className="bg-white rounded-2xl p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-50 active:scale-[0.97] transition-all hover:border-violet-200 hover:shadow-md text-center block"
        >
          <p className="text-lg font-bold text-gray-900 leading-tight">
            {card.value}
          </p>
          <p className="text-[10px] font-medium text-gray-500 mt-0.5 uppercase tracking-wide">
            {card.label}
          </p>
        </Link>
      ))}
    </div>
  );
}
