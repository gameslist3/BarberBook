"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { useRouter } from "next/navigation";

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
      await sendPasswordResetEmail(auth, email, {
        url: window.location.origin + '/signin', // redirect back to signin after reset
        handleCodeInApp: false // Firebase's widget handles the reset
      });
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to send reset email.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-md border border-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Reset your password</h2>
          <p className="mt-2 text-sm text-gray-600">
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
                    <p className="text-sm text-green-800">A password reset link has been sent to your email.</p>
                </div>
                <button
                    onClick={() => router.push("/signin")}
                    className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                >
                    Return to Sign In
                </button>
            </div>
        ) : (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="email">Email address</label>
                <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                />
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
            >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send reset link"}
            </button>
            </form>
        )}
        
        <div className="mt-6 text-center">
            <Link href="/signin" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
              Back to sign in
            </Link>
        </div>
      </div>
    </div>
  );
}
