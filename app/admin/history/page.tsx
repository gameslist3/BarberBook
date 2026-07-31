import { getServerUser } from "@/lib/get-server-user";
import { redirect } from "next/navigation";
import BookingHistoryPanel from "@/components/BookingHistoryPanel";

export default async function AdminHistoryPage() {
  const user = await getServerUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "APP_OWNER")) {
    redirect("/");
  }

  return <BookingHistoryPanel mode="admin" />;
}
