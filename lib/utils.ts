import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Validates an Indian mobile number: exactly 10 digits, optionally prefixed
 * with "+91" / "91". Returns the normalized 10-digit string when valid,
 * otherwise null.
 */
export function normalizePhone(phone?: string | null): string | null {
  if (!phone) return null;
  let digits = phone.replace(/[^0-9]/g, "");
  // Strip a country code ONLY for full international format (12 digits),
  // so a bare 10-digit mobile like "9123456789" is not accidentally truncated.
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}
