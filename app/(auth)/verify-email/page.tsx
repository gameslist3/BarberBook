"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { Loader2, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, sendEmailVerification } from "firebase/auth";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setEmail(user.email);
        
        if (user.emailVerified) {
            router.push('/explore');
        }
      } else {
        router.push("/signin");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleResend = async () => {
    if (!auth.currentUser) return;
    setIsLoading(true);
    setError("");
    try {
      await sendEmailVerification(auth.currentUser, {
        url: window.location.origin + '/explore',
        handleCodeInApp: false
      });
      alert("Verification email sent!");
    } catch (err: any) {
      setError(err.message || "Failed to resend email.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCheckVerification = async () => {
      if (auth.currentUser) {
          setIsLoading(true);
          await auth.currentUser.reload();
          
          if (auth.currentUser.emailVerified) {
            // Update session cookie
            const idToken = await auth.currentUser.getIdToken(true);
            await fetch('/api/auth/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            });
            router.push("/explore");
          } else {
              setError("Email not verified yet. Please check your inbox and click the link.");
          }
          setIsLoading(false);
      }
  }

  if (!email) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-md text-center border border-gray-100">
        <div className="flex justify-center">
            <div className="bg-indigo-50 p-4 rounded-full">
                <Mail className="w-10 h-10 text-indigo-600" />
            </div>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Verify your email</h2>
        <p className="mt-2 text-sm text-gray-600">
          We've sent a verification link to <span className="font-semibold">{email}</span>. Please click the link to verify your account.
        </p>
        
        {error && (
          <div className="rounded-md bg-red-50 p-4 border border-red-200 text-left">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="mt-6 space-y-4">
          <button
            onClick={handleCheckVerification}
            disabled={isLoading}
            className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "I've clicked the link"}
          </button>
          
          <button
            onClick={handleResend}
            disabled={isLoading}
            className="text-sm text-indigo-600 font-medium hover:text-indigo-800"
          >
              Resend email
          </button>
        </div>
      </div>
    </div>
  );
}
