import Link from "next/link";
import Image from "next/image";
import { User, Map, LogIn } from "lucide-react";
import { getServerUser } from "@/lib/get-server-user";
import { redirect } from "next/navigation";

export default async function WelcomePage() {
  const user = await getServerUser();
  if (user) {
    if (user.role === 'ADMIN' || user.role === 'APP_OWNER') redirect('/admin/dashboard');
    if (user.role === 'SHOP_OWNER') redirect('/select-profile');
    redirect('/explore');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-gray-50 overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side - Brand / Image */}
        <div className="md:w-1/2 bg-violet-600 text-white p-12 flex flex-col justify-center items-center text-center relative overflow-hidden">
          <Image
            src="/logo.png"
            alt="BarberBook"
            width={80}
            height={80}
            priority
            className="mb-6 relative z-10 rounded-2xl"
          />
          <h1 className="text-4xl font-bold tracking-tight mb-4 relative z-10">BarberBook</h1>
          <p className="text-violet-100 text-lg relative z-10">
            The premium platform to find and book the best local barber shops instantly.
          </p>
        </div>
        
        {/* Right Side - Actions */}
        <div className="md:w-1/2 p-12 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Get Started</h2>
          
          <div className="space-y-4">
            <Link href="/signin" className="group flex items-center p-4 border border-gray-100 rounded-2xl hover:border-violet-200 hover:bg-violet-50 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="bg-violet-50 p-3 rounded-xl text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-all">
                <LogIn size={24} />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-bold text-gray-900">Login</h3>
                <p className="text-sm text-gray-600">Access your account (All Roles)</p>
              </div>
            </Link>
            
            <Link href="/signup" className="group flex items-center p-4 border border-gray-100 rounded-2xl hover:border-violet-200 hover:bg-violet-50 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="bg-violet-50 p-3 rounded-xl text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-all">
                <User size={24} />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-bold text-gray-900">Create Account</h3>
                <p className="text-sm text-gray-600">For clients looking to book</p>
              </div>
            </Link>
            
            <Link href="/explore" className="group flex items-center p-4 border border-gray-100 rounded-2xl hover:border-gray-900 hover:bg-gray-50 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="bg-gray-100 p-3 rounded-xl text-gray-600 group-hover:bg-gray-900 group-hover:text-white transition-all">
                <Map size={24} />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-bold text-gray-900">Continue as Guest</h3>
                <p className="text-sm text-gray-600">Browse the map directory</p>
              </div>
            </Link>
          </div>
        </div>
        
      </div>
    </div>
  );
}
