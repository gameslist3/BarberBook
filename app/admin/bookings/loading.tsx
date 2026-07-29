import { SkeletonBookingCard, SkeletonTableRow } from "@/components/Skeleton";

export default function AdminBookingsLoading() {
  return (
    <div className="pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-64 bg-gray-100 rounded animate-shimmer" />
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 w-16 bg-gray-100 rounded-lg animate-shimmer" />
          ))}
        </div>
      </div>

      {/* Mobile skeleton */}
      <div className="md:hidden space-y-3">
        {[1, 2, 3].map((i) => <SkeletonBookingCard key={i} />)}
      </div>

      {/* Desktop skeleton */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full min-w-[900px] text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {['Date & Time', 'Shop & Service', 'Client', 'Status'].map((h) => (
                <th key={h} className="px-6 py-4 text-sm font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="px-6 py-4"><div className="h-4 w-28 bg-gray-100 rounded animate-shimmer" /><div className="h-3 w-20 bg-gray-100 rounded mt-1 animate-shimmer" /></td>
                <td className="px-6 py-4"><div className="h-4 w-36 bg-gray-100 rounded animate-shimmer" /><div className="h-3 w-24 bg-gray-100 rounded mt-1 animate-shimmer" /></td>
                <td className="px-6 py-4"><div className="h-4 w-28 bg-gray-100 rounded animate-shimmer" /><div className="h-3 w-36 bg-gray-100 rounded mt-1 animate-shimmer" /></td>
                <td className="px-6 py-4"><div className="h-6 w-20 bg-gray-100 rounded-full animate-shimmer" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
