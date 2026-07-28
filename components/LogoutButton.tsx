"use client";

import { LogOut } from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut as firebaseSignOut } from "firebase/auth";

export function LogoutButton() {
  const handleSignOut = async () => {
    await firebaseSignOut(auth);
    await fetch('/api/auth/session', { method: 'DELETE' });
    window.location.href = '/';
  };

  return (
    <button onClick={handleSignOut} className="w-full flex items-center gap-3 p-4 hover:bg-red-50 rounded-xl transition-colors text-red-600">
      <div className="p-2"><LogOut size={18} /></div>
      <div className="flex-1 text-left font-medium text-sm">Sign Out</div>
    </button>
  );
}
