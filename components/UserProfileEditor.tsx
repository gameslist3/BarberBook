"use client";

import { useEffect, useRef, useState } from "react";
import { Mail, Lock, Loader2, Save, CheckCircle2, AlertCircle, Phone } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { normalizePhone } from "@/lib/utils";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { ProfilePhotoManager } from "./ProfilePhotoManager";

/**
 * Shared personal-profile editor used by both clients and shop owners.
 * Lets the user update their photo and name (and phone, unless hidden) —
 * email is read-only. Resolves the signed-in user itself, so it works on
 * any page.
 */
export function UserProfileEditor({ showPhone = true }: { showPhone?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [role, setRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState<"name" | "phone" | null>(null);
  const loadedRef = useRef({ name: "", phone: "" });
  const initializedRef = useRef(false);
  const unsubDocRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let cancelled = false;
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      if (!u) return;
      // Re-subscribe the doc listener if the signed-in account changes
      unsubDocRef.current?.();
      setUserId(u.uid);
      setEmail(u.email || "");
      unsubDocRef.current = onSnapshot(doc(db, "users", u.uid), (snap) => {
        if (cancelled) return;
        if (!snap.exists()) {
          // Missing doc — stop loading so the form never hangs on a skeleton
          setLoading(false);
          return;
        }
        const d = snap.data();
        setName(d.name || "");
        setPhone(d.phone || "");
        setPhotoUrl(d.photoUrl || "");
        setRole(d.role || "");
        if (!initializedRef.current) {
          loadedRef.current = { name: d.name || "", phone: d.phone || "" };
          initializedRef.current = true;
          setLoading(false);
        }
      });
    });
    return () => {
      cancelled = true;
      unsubscribeAuth();
      unsubDocRef.current?.();
    };
  }, []);

  const hasChanges =
    name !== loadedRef.current.name ||
    (showPhone && phone !== loadedRef.current.phone);

  const handleSave = async () => {
    if (saving || !userId) return;
    setError("");
    setErrorField(null);
    setSaved(false);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Name can't be empty.");
      setErrorField("name");
      return;
    }
    if (showPhone && phone.trim() && !normalizePhone(phone)) {
      setError("Enter a valid 10-digit mobile number.");
      setErrorField("phone");
      return;
    }
    const normalizedPhone = showPhone
      ? phone.trim()
        ? (normalizePhone(phone) ?? "")
        : ""
      : loadedRef.current.phone;

    setSaving(true);
    try {
      // Shop owners don't manage a personal phone here — keep their stored one.
      await updateDoc(doc(db, "users", userId), {
        name: trimmedName,
        ...(showPhone ? { phone: normalizedPhone } : {}),
      });
      const u = auth.currentUser;
      if (u && u.displayName !== trimmedName) {
        await updateProfile(u, { displayName: trimmedName }).catch(() => {});
      }
      loadedRef.current = { name: trimmedName, phone: normalizedPhone };
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      router.refresh();
    } catch (e) {
      console.error("Failed to save profile:", e);
      setError("Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden animate-pulse">
        <div className="p-5 md:p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-100" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-32 bg-gray-100 rounded" />
              <div className="h-3 w-24 bg-gray-100 rounded" />
            </div>
          </div>
          <div className="h-12 w-full bg-gray-100 rounded-[20px]" />
          <div className="h-12 w-full bg-gray-100 rounded-[20px]" />
          <div className="h-12 w-full bg-gray-100 rounded-[20px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
      <div className="p-5 md:p-6">
        {/* Header: photo + title + role badge */}
        <div className="flex items-center gap-4 mb-5">
          <ProfilePhotoManager user={{ id: userId, name, photoUrl }} />
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Personal Profile</h2>
            <p className="text-xs text-gray-500 mt-0.5">Update your details — email can't be changed.</p>
            {role && (
              <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-50 text-violet-700">
                {role.replace("_", " ")}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-gray-500 text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
            <input
              type="text"
              maxLength={60}
              placeholder="Your name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
                if (errorField) setErrorField(null);
                if (saved) setSaved(false);
              }}
              className={`w-full h-12 px-4 rounded-[20px] border text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:bg-white dark:bg-gray-900 transition-all ${
                errorField === "name"
                  ? "border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400"
                  : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-violet-300 focus:border-violet-400"
              }`}
            />
          </div>

          {/* Email — read-only */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-gray-500 text-gray-700 dark:text-gray-300 mb-1.5">
              <span className="inline-flex items-center gap-1.5">
                <Lock size={13} className="text-gray-400" />
                Email (can't be changed)
              </span>
            </label>
            <div className="relative">
              <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                readOnly
                value={email}
                className="w-full h-12 pl-11 pr-4 rounded-[20px] border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 text-sm text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Phone — hidden for shop owners (their shop number is managed in
              the Shop Information section) */}
          {showPhone && (
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-gray-500 text-gray-700 dark:text-gray-300 mb-1.5">Phone Number</label>
              <div className="relative">
                <Phone size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={15}
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (error) setError("");
                    if (errorField) setErrorField(null);
                    if (saved) setSaved(false);
                  }}
                  className={`w-full h-12 pl-11 pr-4 rounded-[20px] border text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:bg-white dark:bg-gray-900 transition-all ${
                    errorField === "phone"
                      ? "border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400"
                      : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-violet-300 focus:border-violet-400"
                  }`}
                />
              </div>
            </div>
          )}

          {error && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
              <AlertCircle size={14} />
              {error}
            </p>
          )}

          {/* Save appears only after a change, stays visible briefly to show confirmation */}
          {(hasChanges || saved) && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center justify-center gap-2 px-5 h-12 rounded-[20px] bg-violet-600 text-white text-sm font-bold uppercase tracking-wider text-gray-500 hover:bg-violet-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-violet-200 w-full sm:w-auto"
            >
              {saving ? <Loader2 size={20} className="animate-spin" /> : saved ? <CheckCircle2 size={20} /> : <Save size={20} />}
              {saving ? "Saving..." : saved ? "Saved" : "Save Changes"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
