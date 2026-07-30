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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-5 py-10">
      <div className="mb-8 text-center w-full max-w-md">
        <div className="flex justify-center mb-5">
          <Image
            src="/logo.png"
            alt="BarberBook"
            width={64}
            height={64}
            className="notranslate rounded-2xl shadow-[0_4px_12px_rgba(124,58,237,0.2)]"
          />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Welcome, {user.name}</h1>
        <p className="mt-2 text-sm md:text-base text-gray-500">Which profile would you like to use today?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full max-w-xl">
        <Link href="/explore" className="group relative rounded-2xl bg-white p-5 md:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-50 hover:shadow-lg hover:border-violet-200 hover:-translate-y-0.5 transition-all text-center flex flex-col items-center">
          <div className="mx-auto w-14 h-14 md:w-16 md:h-16 bg-violet-50 rounded-2xl flex items-center justify-center mb-3 md:mb-4 group-hover:bg-violet-100 group-hover:scale-105 transition-all">
            <User size={28} className="text-violet-600" />
          </div>
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-1.5">Client Profile</h2>
          <p className="text-xs md:text-sm text-gray-500 leading-relaxed">Browse shops, book appointments, and manage your haircuts.</p>
        </Link>

        <Link href="/shop/dashboard" className="group relative rounded-2xl bg-white p-5 md:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-50 hover:shadow-lg hover:border-violet-200 hover:-translate-y-0.5 transition-all text-center flex flex-col items-center">
          <div className="mx-auto w-14 h-14 md:w-16 md:h-16 bg-violet-50 rounded-2xl flex items-center justify-center mb-3 md:mb-4 group-hover:bg-violet-100 group-hover:scale-105 transition-all">
            <Store size={28} className="text-violet-600" />
          </div>
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-1.5">Shop Owner Profile</h2>
          <p className="text-xs md:text-sm text-gray-500 leading-relaxed">Manage your barbershop, view bookings, and update services.</p>
        </Link>
      </div>
    </div>
  );
}
