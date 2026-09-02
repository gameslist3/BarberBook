import { SkeletonTableRow } from "@/components/Skeleton";

export default function AdminUsersLoading() {
  return (
    <div>
      <div className="mb-8">
        <div className="h-8 w-28 bg-gray-100 rounded animate-shimmer mb-1" />
        <div className="h-4 w-48 bg-gray-100 rounded animate-shimmer" />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <table className="w-full min-w-[700px] text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              {['Name', 'Email', 'Role', 'Joined', 'Actions'].map((h) => (
                <th key={h} className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonTableRow key={i} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
