"use client";

import { useEffect, useState } from "react";

/**
 * <img> wrapper that never shows a broken-image icon: if the URL is missing
 * or fails to load (blocked CDN, deleted asset, offline), it renders the
 * provided `fallback` content instead. Used for shop logos, gallery photos
 * and avatars so images stay presentable for everyone.
 */
export function SafeImage({
  src,
  alt,
  className,
  fallback,
  ...rest
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  /** Content shown while/if the image is unavailable. */
  fallback?: React.ReactNode;
} & React.ImgHTMLAttributes<HTMLImageElement>) {
  const [failed, setFailed] = useState(false);

  // Reset the error state whenever the URL changes so a new (valid) image
  // isn't stuck showing the fallback from an earlier failed load.
  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div className={`flex h-full w-full items-center justify-center ${className || ""}`}>
        {fallback || null}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || ""}
      className={className}
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}
