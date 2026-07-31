"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { checkUserActiveBooking } from "@/app/actions/client";

/**
 * Keeps a user with an active booking pinned to the locked session screen.
 * Runs on every client page — if an active booking exists, they're sent to
 * /session and can't wander to explore/profile/etc. until it ends.
 */
export function SessionGuard() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === "/session") return;
    let cancelled = false;
    checkUserActiveBooking().then((res) => {
      if (!cancelled && res.hasActive) {
        router.replace("/session");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return null;
}
