import { adminDb } from "@/lib/firebase-admin";
import { getServerUser } from "@/lib/get-server-user";
import { redirect } from "next/navigation";
import { Users, Mail, Clock } from "lucide-react";

export default async function AdminUsersPage() {
  const user = await getServerUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "APP_OWNER")) {
    redirect("/");
  }

  const usersSnapshot = await adminDb.collection("users").orderBy("createdAt", "desc").get();
  
  const users = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt
      };
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">All Users</h1>
        <p className="text-gray-500 mt-1">Manage all registered accounts.</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                        {u.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{u.name}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail size={12} /> {u.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                        u.role === 'SHOP_OWNER' ? 'bg-indigo-100 text-indigo-800' :
                        'bg-green-100 text-green-800'
                    }`}>
                        {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                        <Clock size={14} />
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {users.length === 0 && (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <Users size={32} className="mb-2 text-gray-300" />
            <p>No users found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
