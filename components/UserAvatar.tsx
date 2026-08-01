"use client";

import Image from "next/image";

interface UserAvatarProps {
  user?: { name?: string; photoUrl?: string; photoURL?: string } | null;
  /** Box size + shape + ring classes (e.g. "w-10 h-10 rounded-full ring-2 ring-white shadow-sm") */
  className?: string;
  /** Fallback colors/font used when there is no photo (e.g. "bg-violet-100 text-violet-700 font-bold text-sm") */
  fallbackClassName?: string;
}

/**
 * Renders a user's profile photo when they have one, otherwise their
 * initial-letter avatar. Used everywhere a user is shown to other people
 * (shop dashboard, bookings, admin, history) so profile photos are shared.
 */
export function UserAvatar({
  user,
  className = "w-10 h-10 rounded-full ring-2 ring-white shadow-sm",
  fallbackClassName = "bg-violet-100 text-violet-700 font-bold text-sm",
}: UserAvatarProps) {
  const photoUrl = user?.photoUrl || user?.photoURL || "";
  const name = user?.name || "U";

  return (
    <div className={`relative overflow-hidden shrink-0 ${className}`}>
      {photoUrl ? (
        <Image
          src={photoUrl}
          alt={name}
          fill
          sizes="96px"
          className="object-cover"
        />
      ) : (
        <div className={`flex h-full w-full items-center justify-center ${fallbackClassName}`}>
          {name.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}
