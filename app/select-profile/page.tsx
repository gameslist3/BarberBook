import Link from "next/link";
import Image from "next/image";
import { getServerUser } from "@/lib/get-server-user";
import { redirect } from "next/navigation";
import { Store, User } from "lucide-react";

export default async function SelectProfilePage() {
  const user = await getServerUser();
  
  if (!user) {
    redirect("/signin");
  }

  if (user.role !== "SHOP_OWNER") {
    redirect("/explore");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="mb-8 text-center">
        <div className="flex justify-center mb-4">
          <Image
            src="/logo.png"
            alt="BarberBook"
            width={56}
            height={56}
            className="rounded-xl"
          />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {user.name}</h1>
        <p className="mt-2 text-gray-600">Which profile would you like to use today?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        <Link href="/explore" className="group relative rounded-2xl bg-white p-8 shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-300 transition-all text-center">
          <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
            <User size={32} className="text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Client Profile</h2>
          <p className="text-sm text-gray-600">Browse shops, book appointments, and manage your haircuts.</p>
        </Link>

        <Link href="/shop/dashboard" className="group relative rounded-2xl bg-white p-8 shadow-sm border border-gray-100 hover:shadow-md hover:indigo-300 transition-all text-center">
          <div className="mx-auto w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
            <Store size={32} className="text-indigo-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Shop Owner Profile</h2>
          <p className="text-sm text-gray-600">Manage your barbershop, view bookings, and update services.</p>
        </Link>
      </div>
    </div>
  );
}
