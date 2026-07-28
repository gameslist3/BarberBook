import Link from "next/link";
import { Scissors, User, Map, LogIn } from "lucide-react";
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
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side - Brand / Image */}
        <div className="md:w-1/2 bg-indigo-600 text-white p-12 flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <Scissors size={64} className="mb-6 relative z-10" />
          <h1 className="text-4xl font-bold tracking-tight mb-4 relative z-10">BarberBook</h1>
          <p className="text-indigo-100 text-lg relative z-10">
            The premium platform to find and book the best local barber shops instantly.
          </p>
        </div>
        
        {/* Right Side - Actions */}
        <div className="md:w-1/2 p-12 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Get Started</h2>
          
          <div className="space-y-4">
            <Link href="/signin" className="group flex items-center p-4 border border-gray-200 rounded-xl hover:border-indigo-600 hover:bg-indigo-50 transition-all">
              <div className="bg-indigo-100 p-3 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <LogIn size={24} />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-bold text-gray-900">Login</h3>
                <p className="text-sm text-gray-500">Access your account (All Roles)</p>
              </div>
            </Link>
            
            <Link href="/signup" className="group flex items-center p-4 border border-gray-200 rounded-xl hover:border-indigo-600 hover:bg-indigo-50 transition-all">
              <div className="bg-indigo-100 p-3 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <User size={24} />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-bold text-gray-900">Create Account</h3>
                <p className="text-sm text-gray-500">For clients looking to book</p>
              </div>
            </Link>
            
            <Link href="/explore" className="group flex items-center p-4 border border-gray-200 rounded-xl hover:border-gray-900 hover:bg-gray-50 transition-all">
              <div className="bg-gray-100 p-3 rounded-lg text-gray-600 group-hover:bg-gray-900 group-hover:text-white transition-colors">
                <Map size={24} />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-bold text-gray-900">Continue as Guest</h3>
                <p className="text-sm text-gray-500">Browse the map directory</p>
              </div>
            </Link>
          </div>
        </div>
        
      </div>
    </div>
  );
}
