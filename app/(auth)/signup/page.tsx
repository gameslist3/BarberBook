"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Loader2, Eye, EyeOff, CheckCircle2, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { normalizePhone } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Optional phone must be a valid 10-digit Indian mobile number.
    const normalizedPhone = phone.trim() ? (normalizePhone(phone) ?? "") : "";
    if (phone.trim() && !normalizedPhone) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const idToken = await user.getIdToken();
      
      // Update display name
      await updateProfile(user, { displayName: name });
      
      // Save user to Firestore
      await setDoc(doc(db, "users", user.uid), {
        name,
        // Store lowercase so multi-role detection (query by canonical auth
        // email) finds every profile linked to the same email.
        email: email.trim().toLowerCase(),
        phone: normalizedPhone,
        role: "CLIENT", // Default role
        createdAt: serverTimestamp(),
      });

      // Create session cookie
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      
      // Send email verification link (non-blocking — don't prevent signup if it fails)
      try {
        const { sendEmailVerification } = await import('firebase/auth');
        await sendEmailVerification(user, {
          url: window.location.origin + '/explore',
          handleCodeInApp: true
        });
      } catch (verifyErr) {
        console.warn("Failed to send verification email:", verifyErr);
        // Continue regardless — account was created successfully
      }
      
      // Show success animation before redirecting
      setShowSuccess(true);
      setTimeout(() => {
        router.push("/explore");
      }, 2000);

      return; // Exit early so the catch below only handles pre-redirect errors
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
          setError("This email is already registered. Please sign in instead.");
      } else if (err.code === 'auth/weak-password') {
          setError("Password should be at least 6 characters.");
      } else {
          setError(err.message || "Failed to create account.");
      }
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-800 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle variant="icon" />
      </div>
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white dark:bg-gray-900 p-10 shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-gray-50 dark:border-gray-900 relative overflow-hidden">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/logo2.svg"
              alt="BarberBook"
              width={56}
              height={56}
              className="notranslate"
              style={{ objectFit: 'contain' }}
            />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Create an account</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Join <span className="notranslate">BarberBook</span> today</p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 border border-red-100">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="mt-1 flex h-12 w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
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

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="phone">Phone Number <span className="text-gray-400 font-normal">(optional)</span></label>
              <div className="relative mt-1">
                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  className="flex h-12 w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 pl-11 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <p className="mt-1 text-[11px] text-gray-400">Shops can call you about your appointment.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="password">Password</label>
              <div className="relative mt-1">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  className="flex h-12 w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 pr-10 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
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

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full justify-center rounded-2xl bg-violet-600 px-3 py-3 text-sm font-semibold text-white shadow-md shadow-violet-200 hover:bg-violet-700 active:bg-violet-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Sign Up"}
          </button>
        </form>

        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <Link href="/signin" className="font-medium text-violet-600 hover:text-violet-500 transition-colors">
            Sign in
          </Link>
        </p>
      </div>

      {/* ── Success overlay animation ── */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 200 }}
              className="bg-white dark:bg-gray-900 rounded-3xl p-10 mx-4 max-w-sm w-full text-center shadow-2xl"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15, type: "spring", damping: 15, stiffness: 200 }}
                className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-5"
              >
                <motion.div
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <CheckCircle2 size={40} className="text-emerald-600" />
                </motion.div>
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl font-bold text-gray-900 dark:text-white mb-2"
              >
                Account Created! 🎉
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-sm text-gray-600 dark:text-gray-400"
              >
                Welcome to Barber Book. We value your time. Book → Go → Take service. No time waste.
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-6 flex justify-center"
              >
                <div className="w-6 h-6 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
