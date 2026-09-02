import { SkeletonStatCard } from "@/components/Skeleton";
import { Activity } from "lucide-react";

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-5 pb-6">
      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gray-100 shrink-0">
              <div className="w-5 h-5 bg-gray-200 rounded animate-shimmer" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="h-3 w-16 bg-gray-100 rounded mb-1.5 animate-shimmer" />
              <div className="h-6 w-20 bg-gray-100 rounded animate-shimmer" />
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Skeleton */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3.5 border-b border-gray-100 dark:border-gray-800">
          <Activity size={18} className="text-gray-200" />
          <div className="h-4 w-28 bg-gray-100 rounded animate-shimmer" />
        </div>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-8 h-8 bg-gray-100 rounded-full mb-3 animate-shimmer" />
          <div className="h-4 w-44 bg-gray-100 rounded mb-2 animate-shimmer" />
          <div className="h-3 w-56 bg-gray-100 rounded animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
