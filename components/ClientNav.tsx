"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut as firebaseSignOut, User } from "firebase/auth";

export function ClientNav({ serverRole }: { serverRole?: string }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await firebaseSignOut(auth);
    await fetch('/api/auth/session', { method: 'DELETE' });
    window.location.href = '/';
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;
    
    try {
      const res = await fetch('/api/auth/delete-account', { method: 'DELETE' });
      if (!res.ok) throw new Error("Failed to delete account");
      
      await firebaseSignOut(auth);
      await fetch('/api/auth/session', { method: 'DELETE' });
      window.location.href = '/';
    } catch (e) {
      alert("Error deleting account. Please try again.");
    }
  };

  return (
    <nav className="flex items-center gap-4">
      {user ? (
        <>
          <span className="text-sm text-gray-500 hidden sm:inline-block">Welcome, {user.displayName || user.email}</span>
          {serverRole === "SHOP_OWNER" ? (
            <Link href="/shop/dashboard" className="text-sm font-medium bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors hidden sm:inline-block">Shop Dashboard</Link>
          ) : (
            <button onClick={handleDeleteAccount} className="text-sm font-medium text-red-600 hover:text-red-800">Delete Account</button>
          )}
          <button onClick={handleSignOut} className="text-sm font-medium text-gray-700 hover:text-indigo-600">Sign Out</button>
        </>
      ) : (
        <>
          <Link href="/signin" className="text-sm font-medium text-gray-700 hover:text-indigo-600">Sign In</Link>
          <Link href="/signup" className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">Sign Up</Link>
        </>
      )}
    </nav>
  );
}
