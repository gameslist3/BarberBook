import Link from "next/link";
import Image from "next/image";
import { Scissors, ArrowRight } from "lucide-react";
import { getServerUser } from "@/lib/get-server-user";
import { redirect } from "next/navigation";
import { TaglineText } from "@/components/TaglineText";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function WelcomePage() {
  const user = await getServerUser();
  if (user) {
    if (user.role === 'ADMIN' || user.role === 'APP_OWNER') redirect('/admin/dashboard');
    if (user.role === 'SHOP_OWNER') redirect('/select-profile');
    redirect('/explore');
  }

  return (
    <div className="h-dvh w-full flex flex-col justify-between items-center relative overflow-hidden m3-animated-gradient select-none">

      {/* ── Subtle M3 Ambient Glow Layer ── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[520px] h-[340px] sm:h-[520px] bg-white/10 dark:bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[280px] sm:w-[400px] h-[280px] sm:h-[400px] bg-fuchsia-500/10 dark:bg-purple-900/20 rounded-full blur-3xl" />
      </div>

      {/* ── Top Bar: Theme Toggle & Sign In Link ── */}
      <header className="w-full max-w-5xl px-6 pt-6 sm:pt-8 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-white/70 bg-white/10 dark:bg-black/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/15">
            Premium Barber Care
          </span>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle variant="glass" />
          <Link
            href="/signin"
            className="text-sm font-semibold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 dark:bg-black/30 dark:hover:bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 transition-all duration-200 active:scale-95"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* ── Center Content: Logo & Headline ── */}
      <main className="w-full max-w-lg px-6 flex flex-col items-center text-center my-auto relative z-10">
        {/* M3 Logo Container with Soft Glow */}
        <div className="relative mb-6 sm:mb-8 group">
          <div className="absolute -inset-2 bg-white/20 dark:bg-violet-500/20 rounded-3xl blur-xl transition-all duration-500 group-hover:scale-110" />
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white/15 dark:bg-black/30 backdrop-blur-xl border border-white/25 dark:border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.2)] flex items-center justify-center p-5 transition-transform duration-300 hover:scale-105">
            <Image
              src="/logo2.svg"
              alt="BarberBook"
              width={76}
              height={76}
              priority
              className="notranslate brightness-0 invert object-contain"
            />
          </div>
        </div>

        {/* Title */}
        <h1 className="notranslate text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight drop-shadow-sm mb-3">
          BarberBook
        </h1>

        {/* Content / Dynamic Tagline */}
        <div className="text-white/80 text-base sm:text-lg max-w-md mx-auto font-medium">
          <TaglineText />
        </div>
      </main>

      {/* ── Bottom Section: Single 'Book Now' Button ── */}
      <footer className="w-full max-w-lg px-6 pb-8 sm:pb-12 relative z-20">
        <Link
          href="/explore"
          className="group w-full h-15 sm:h-16 rounded-full bg-white dark:bg-violet-100 text-violet-700 dark:text-violet-950 font-bold text-lg sm:text-xl shadow-[0_10px_35px_rgba(0,0,0,0.25)] hover:shadow-[0_14px_45px_rgba(0,0,0,0.35)] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 border border-white/40"
        >
          <Scissors size={22} className="text-violet-600 dark:text-violet-900 group-hover:rotate-12 transition-transform duration-200" />
          <span>Book Now</span>
          <ArrowRight size={20} className="text-violet-600 dark:text-violet-900 group-hover:translate-x-1 transition-transform duration-200" />
        </Link>
      </footer>

    </div>
  );
}
