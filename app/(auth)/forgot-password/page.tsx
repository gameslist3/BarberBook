"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/unauthorized-continue-uri' || (err.message && err.message.includes('auth/unauthorized-continue-uri'))) {
        setError("Domain configuration error. Please contact the administrator.");
      } else {
        setError(err.message || "Failed to send reset email.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-800 px-4 relative">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle variant="icon" />
      </div>
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white dark:bg-gray-900 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-gray-50 dark:border-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Reset your password</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Enter your email to receive a password reset link.
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 border border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success ? (
            <div className="text-center">
                <div className="rounded-md bg-green-50 p-4 border border-green-200 mb-6">
                    <p className="text-sm text-green-800">A password reset link has been sent to your email. Check your inbox (and spam folder).</p>
                </div>
                <button
                    onClick={() => router.push("/signin")}
                    className="flex w-full justify-center rounded-2xl bg-violet-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm shadow-violet-200 hover:bg-violet-700 active:bg-violet-800 transition-all"
                >
                    Return to Sign In
                </button>
            </div>
        ) : (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="email">Email address</label>
                <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 flex h-12 w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                />
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center rounded-2xl bg-violet-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm shadow-violet-200 hover:bg-violet-700 active:bg-violet-800 transition-all disabled:opacity-50"
            >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send reset link"}
            </button>
            </form>
        )}
        
        <div className="mt-6 text-center">
            <Link href="/signin" className="text-sm font-medium text-violet-600 hover:text-violet-500">
              Back to sign in
            </Link>
        </div>
      </div>
    </div>
  );
}
