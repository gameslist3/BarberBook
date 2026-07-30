import Link from "next/link";
import Image from "next/image";
import { User, Map, LogIn, ChevronRight } from "lucide-react";
import { getServerUser } from "@/lib/get-server-user";
import { redirect } from "next/navigation";
import { TaglineText } from "@/components/TaglineText";

export default async function WelcomePage() {
  const user = await getServerUser();
  if (user) {
    if (user.role === 'ADMIN' || user.role === 'APP_OWNER') redirect('/admin/dashboard');
    if (user.role === 'SHOP_OWNER') redirect('/select-profile');
    redirect('/explore');
  }

  return (
    <div className="h-dvh w-full bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 flex flex-col md:flex-row md:items-center md:justify-center p-0 md:p-4 relative overflow-hidden">

      {/* ── Animated Particle Dots ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute w-1.5 h-1.5 bg-violet-300/40 rounded-full top-[12%] left-[20%] animate-float" style={{ animationDuration: '3.5s' }} />
        <div className="absolute w-1 h-1 bg-purple-300/40 rounded-full top-[30%] left-[70%] animate-float" style={{ animationDuration: '4.2s', animationDelay: '0.8s' }} />
        <div className="absolute w-2 h-2 bg-fuchsia-300/30 rounded-full top-[60%] left-[15%] animate-float" style={{ animationDuration: '3.8s', animationDelay: '1.5s' }} />
        <div className="absolute w-1.5 h-1.5 bg-violet-300/30 rounded-full top-[80%] left-[80%] animate-float" style={{ animationDuration: '4.5s', animationDelay: '0.3s' }} />
        <div className="absolute w-1 h-1 bg-purple-300/35 rounded-full top-[45%] left-[50%] animate-float" style={{ animationDuration: '5s', animationDelay: '2s' }} />

        {/* Floating decorative icons */}
        <span className="absolute top-[15%] left-[6%] text-3xl opacity-[0.10] animate-icon hidden md:block" style={{ animationDuration: '3s' }}>✂️</span>
        <span className="absolute top-[20%] right-[8%] text-2xl opacity-[0.10] animate-icon hidden md:block" style={{ animationDuration: '4s', animationDelay: '0.5s' }}>✨</span>
        <span className="absolute bottom-[28%] left-[5%] text-2xl opacity-[0.10] animate-icon hidden md:block" style={{ animationDuration: '3.5s', animationDelay: '1s' }}>⭐</span>
        <span className="absolute bottom-[15%] right-[7%] text-xl opacity-[0.10] animate-icon hidden md:block" style={{ animationDuration: '4.5s', animationDelay: '1.5s' }}>💈</span>

        {/* Decorative background blobs */}
        <div
          className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-violet-300/40 to-purple-300/40 rounded-full blur-3xl"
          style={{ animation: "pulse 4s ease-in-out infinite" }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-gradient-to-tr from-fuchsia-300/25 to-violet-300/25 rounded-full blur-3xl"
          style={{ animation: "pulse 5s ease-in-out infinite 1s" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-violet-100/20 to-purple-100/20 rounded-full blur-3xl" />
      </div>

      {/* ── Main Container ── */}
      <div className="w-full max-w-5xl relative z-10 md:px-4 h-full md:h-auto flex md:items-center">
        <div className="w-full bg-white md:rounded-[32px] md:shadow-[0_8px_40px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col md:flex-row md:border border-gray-50/80 animate-fadeIn">

          {/* ════════════════════════════════════════════════ */}
          {/*  LEFT SIDE — BRAND HERO WITH SHIMMER LOGO       */}
          {/* ════════════════════════════════════════════════ */}
          <div className="relative md:w-[45%] bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 md:rounded-none overflow-hidden flex flex-col items-center text-center px-6 pt-0 pb-8 md:px-12 md:py-14 flex-1 md:flex-none animate-scaleIn"
               style={{ animationDuration: '0.4s' }}>

            {/* Inner decorative rings with gentle pulse */}
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
              <div
                className="absolute -top-20 -right-20 w-72 h-72 bg-white/[0.06] rounded-full"
                style={{ animation: "pulse 6s ease-in-out infinite" }}
              />
              <div
                className="absolute -bottom-16 -left-16 w-56 h-56 bg-white/[0.04] rounded-full"
                style={{ animation: "pulse 7s ease-in-out infinite 1s" }}
              />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/[0.02] rounded-full" />
              <div className="absolute top-6 right-6 text-2xl opacity-[0.08] animate-float" style={{ animationDuration: '3s' }}>✂️</div>
              <div className="absolute bottom-10 left-8 text-xl opacity-[0.07] animate-float" style={{ animationDuration: '4s', animationDelay: '0.7s' }}>💈</div>
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center flex-1 justify-center w-full">
              {/* Logo with shimmer effect */}
              <div className="relative mb-5 md:mb-6 group">
                {/* Glow ring */}
                <div className="absolute inset-0 bg-white/25 rounded-2xl blur-xl scale-125 animate-pulse" style={{ animationDuration: '3s' }} />
                {/* Shimmer overlay - moves across the logo */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden z-20">
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                    style={{
                      animation: 'shimmer 3s ease-in-out infinite',
                      backgroundSize: '200% 100%',
                    }}
                  />
                </div>
                <Image
                  src="/logo.png"
                  alt="BarberBook"
                  width={88}
                  height={88}
                  priority
                  className="notranslate relative z-10 rounded-2xl shadow-lg brightness-0 invert"
                />
              </div>

              <h1
                className="notranslate text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight"
                style={{ animation: 'fadeInUp 0.6s ease-out 0.15s both' }}
              >
                BarberBook
              </h1>

              <TaglineText />
            </div>


          </div>

          {/* ════════════════════════════════════════════════ */}
          {/*  RIGHT SIDE — ACTION CARDS                      */}
          {/* ════════════════════════════════════════════════ */}
          <div className="md:w-[55%] px-6 py-8 md:px-12 md:py-14 lg:px-14 flex flex-col justify-center bg-white flex-1 md:flex-none">
            <div className="w-full mx-auto max-w-sm">

              {/* Header */}
              <div className="mb-7 text-center md:text-left" style={{ animation: 'fadeInUp 0.5s ease-out 0.1s both' }}>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Get Started
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  Choose your path to great style
                </p>
              </div>

              {/* Action Cards */}
              <div className="space-y-3">

                {/* ── Login (Primary) ── */}
                <Link
                  href="/signin"
                  className="group flex items-center gap-4 p-4 bg-gradient-to-r from-violet-50 to-purple-50/80 border border-violet-100 rounded-2xl hover:from-violet-100 hover:to-purple-100/80 hover:border-violet-200 active:scale-[0.98] transition-all duration-300 shadow-sm hover:shadow-md"
                  style={{ animation: 'fadeInUp 0.5s ease-out 0.2s both' }}
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-violet-600 rounded-xl flex items-center justify-center text-white shadow-sm group-hover:scale-105 group-hover:shadow-md transition-all duration-300">
                    <LogIn size={20} className="animate-icon-hover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-[17px]">Login</h3>
                    <p className="text-[13px] text-gray-400 leading-snug">Access your account</p>
                  </div>
                  <ChevronRight
                    size={18}
                    className="text-violet-300 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all flex-shrink-0"
                  />
                </Link>

                {/* ── Create Account (Secondary) ── */}
                <Link
                  href="/signup"
                  className="group flex items-center gap-4 p-4 border border-gray-100 rounded-2xl hover:border-violet-200 hover:bg-violet-50/40 active:scale-[0.98] transition-all duration-300"
                  style={{ animation: 'fadeInUp 0.5s ease-out 0.35s both' }}
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 group-hover:bg-violet-600 group-hover:text-white group-hover:shadow-sm transition-all duration-300">
                    <User size={20} className="animate-icon-hover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-[17px]">Create Account</h3>
                    <p className="text-[13px] text-gray-400 leading-snug">For clients looking to book</p>
                  </div>
                  <ChevronRight
                    size={18}
                    className="text-gray-300 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all flex-shrink-0"
                  />
                </Link>

                {/* ── Continue as Guest (Tertiary) ── */}
                <Link
                  href="/explore"
                  className="group flex items-center gap-4 p-4 border border-dashed border-gray-200 rounded-2xl hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] transition-all duration-300"
                  style={{ animation: 'fadeInUp 0.5s ease-out 0.5s both' }}
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-gray-900 group-hover:text-white group-hover:shadow-sm transition-all duration-300">
                    <Map size={20} className="animate-icon-hover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-[17px]">Continue as Guest</h3>
                    <p className="text-[13px] text-gray-400 leading-snug">Browse the map directory</p>
                  </div>
                  <ChevronRight
                    size={18}
                    className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all flex-shrink-0"
                  />
                </Link>

              </div>



            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
