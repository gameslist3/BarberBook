"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      const idToken = await userCredential.user.getIdToken();

      // Create session cookie
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      
      // Fetch role to determine redirect
      const userDoc = await getDoc(doc(db, "users", uid));
      const role = userDoc.exists() ? userDoc.data().role : "CLIENT";

      if (role === "ADMIN") {
          router.push("/admin/dashboard");
      } else if (role === "SHOP_OWNER") {
          router.push("/select-profile");
      } else {
          router.push("/explore");
      }
    } catch (err: any) {
      console.error(err);
      setError("Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle variant="icon" />
      </div>

      {/* Background decorative elements - blending from splash */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-[500px] h-500px] bg-violet-100/40 dark:bg-violet-900/10 rounded-full blur-3xl" style={{ animation: "pulse 6s ease-in-out infinite" }} />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-purple-100/30 dark:bg-purple-900/10 rounded-full blur-3xl" style={{ animation: "pulse 7s ease-in-out infinite 1s" }} />
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10" style={{ animation: "fadeInUp 0.6s ease-out 0.1s both" }}>
        {/* Logo with shimmer animation - matches splash style */}
        <div className="text-center">
          <div className="flex justify-center mb-5">
            <div className="relative group">
              {/* Glow ring */}
              <div className="absolute inset-0 bg-violet-200/40 dark:bg-violet-800/20 rounded-2xl blur-xl scale-125 animate-pulse" style={{ animationDuration: "3s" }} />
              {/* Shimmer overlay */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden z-20">
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
                  style={{
                    animation: "shimmer 3s ease-in-out infinite",
                    backgroundSize: "200% 100%",
                  }}
                />
              </div>
              <Image
                src="/logo2.svg"
                alt="BarberBook"
                width={64}
                height={64}
                className="notranslate relative z-10"
                style={{ objectFit: "contain" }}
              />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Sign in to your account</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Welcome back to <span className="notranslate font-medium text-violet-600">BarberBook</span></p>
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50 dark:bg-red-950/30 p-4 border border-red-100 dark:border-red-900/30" style={{ animation: "fadeInUp 0.3s ease-out both" }}>
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-3">
            <div style={{ animation: "fadeInUp 0.5s ease-out 0.15s both" }}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1.5 flex h-12 w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div style={{ animation: "fadeInUp 0.5s ease-out 0.25s both" }}>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="password">Password</label>
                <Link href="/forgot-password" className="text-sm font-medium text-violet-600 hover:text-violet-500 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="flex h-12 w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 pr-10 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:text-gray-300 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div style={{ animation: "fadeInUp 0.5s ease-out 0.35s both" }}>
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center rounded-2xl bg-violet-600 px-3 py-3 text-sm font-semibold text-white shadow-md shadow-violet-200 hover:bg-violet-700 active:bg-violet-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Sign In"}
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400" style={{ animation: "fadeInUp 0.5s ease-out 0.45s both" }}>
          Don't have an account?{" "}
          <Link href="/signup" className="font-medium text-violet-600 hover:text-violet-500 transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
