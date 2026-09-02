import { adminDb } from "@/lib/firebase-admin";
import { getServerUser } from "@/lib/get-server-user";
import { redirect } from "next/navigation";
import UserTable from "@/components/UserTable";

export const dynamic = "force-dynamic";

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Users</h1>
        <p className="text-gray-500 mt-1">Manage all registered accounts.</p>
      </div>
      
      <UserTable users={users} />
    </div>
  );
}
