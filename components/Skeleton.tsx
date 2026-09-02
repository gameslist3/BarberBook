/**
 * Reusable Skeleton loading components with shimmer animation.
 * Use these to show placeholders while data is being fetched.
 */

import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────── */
/*  Base skeleton block                         */
/* ─────────────────────────────────────────── */
function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-gray-100/80",
        "animate-pulse",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer",
        "before:bg-gradient-to-r before:from-transparent before:via-white/50 before:to-transparent",
        className
      )}
    />
  );
}

/* ─────────────────────────────────────────── */
/*  Public API                                  */
/* ─────────────────────────────────────────── */

/** Full skeleton card (icon, text lines, button area) */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("bg-white dark:bg-gray-900 rounded-2xl border border-gray-50 dark:border-gray-900 shadow-sm p-4 space-y-3", className)}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <SkeletonBlock className="w-12 h-12 rounded-2xl" />
          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="h-3 w-20" />
          </div>
        </div>
        <SkeletonBlock className="h-8 w-8 rounded-lg" />
      </div>
      <SkeletonBlock className="h-10 w-full rounded-xl" />
      <SkeletonBlock className="h-11 w-full rounded-xl" />
    </div>
  );
}

/** Explore page skeleton */
export function SkeletonExploreList() {
  return (
    <div className="flex flex-col gap-2 mt-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-50 dark:border-gray-900 shadow-sm p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <SkeletonBlock className="w-12 h-12 rounded-2xl" />
              <SkeletonBlock className="h-4 w-32" />
            </div>
            <div className="flex gap-1.5">
              <SkeletonBlock className="h-9 w-9 rounded-xl" />
              <SkeletonBlock className="h-9 w-9 rounded-xl" />
            </div>
          </div>
          <SkeletonBlock className="h-10 w-full rounded-xl" />
          <SkeletonBlock className="h-11 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

/** Shop detail page skeleton */
export function SkeletonShopDetail() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-12">
      <SkeletonBlock className="h-4 w-28 mb-6" />
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Hero */}
        <SkeletonBlock className="h-64 md:h-80 w-full rounded-none" />
        {/* Content */}
        <div className="p-8 space-y-8">
          <div className="flex flex-wrap gap-6">
            <SkeletonBlock className="h-5 w-48" />
            <SkeletonBlock className="h-5 w-36" />
            <SkeletonBlock className="h-5 w-32" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-6">
              <SkeletonBlock className="h-7 w-32" />
              {[1, 2, 3].map((i) => (
                <SkeletonBlock key={i} className="h-20 w-full rounded-xl" />
              ))}
              <SkeletonBlock className="h-7 w-28 mt-8" />
              <SkeletonBlock className="h-32 w-full rounded-2xl" />
            </div>
            <div>
              <SkeletonBlock className="h-96 w-full rounded-xl sticky top-24" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Booking/dashboard card skeleton */
export function SkeletonBookingCard() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-50 dark:border-gray-900 shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SkeletonBlock className="w-10 h-10 rounded-full" />
          <SkeletonBlock className="h-4 w-32" />
        </div>
        <SkeletonBlock className="h-7 w-20 rounded-full" />
      </div>
      <SkeletonBlock className="h-10 w-full rounded-xl" />
    </div>
  );
}

/** Service card skeleton */
export function SkeletonServiceCard() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-50 dark:border-gray-900 shadow-sm p-4 space-y-3">
      <div className="flex items-center gap-2.5">
        <SkeletonBlock className="w-8 h-8 rounded-lg" />
        <SkeletonBlock className="h-4 w-36" />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-5 w-14" />
          <SkeletonBlock className="h-4 w-12" />
        </div>
        <div className="flex items-center gap-2">
          <SkeletonBlock className="h-6 w-10 rounded-full" />
          <SkeletonBlock className="h-7 w-7 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/** Tabular row skeleton (for admin table) */
export function SkeletonTableRow() {
  return (
    <tr className="border-b border-gray-100 dark:border-gray-800">
      <td className="px-6 py-4"><SkeletonBlock className="h-4 w-32" /></td>
      <td className="px-6 py-4"><SkeletonBlock className="h-4 w-24" /></td>
      <td className="px-6 py-4"><SkeletonBlock className="h-4 w-36" /></td>
      <td className="px-6 py-4"><SkeletonBlock className="h-4 w-28" /></td>
      <td className="px-6 py-4"><SkeletonBlock className="h-6 w-16 rounded-full" /></td>
      <td className="px-6 py-4 text-right"><SkeletonBlock className="h-8 w-16 rounded-lg ml-auto" /></td>
    </tr>
  );
}

/** Settings form skeleton */
export function SkeletonForm() {
  return (
    <div className="space-y-5">
      {[1, 2, 3].map((section) => (
        <div key={section} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-50 dark:border-gray-900 overflow-hidden">
          <div className="px-4 py-4 border-b border-gray-50 dark:border-gray-900">
            <SkeletonBlock className="h-5 w-36" />
          </div>
          <div className="p-4 space-y-4">
            {[1, 2].map((field) => (
              <div key={field}>
                <SkeletonBlock className="h-3.5 w-24 mb-1.5" />
                <SkeletonBlock className="h-12 w-full rounded-2xl" />
              </div>
            ))}
          </div>
        </div>
      ))}
      <SkeletonBlock className="h-12 w-full rounded-2xl" />
    </div>
  );
}

/** Stat card skeleton (for stat cards grid) */
export function SkeletonStatCard() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-3.5 shadow-sm border border-gray-100 dark:border-gray-800">
      <SkeletonBlock className="h-6 w-12 mb-1" />
      <SkeletonBlock className="h-3 w-14" />
    </div>
  );
}
