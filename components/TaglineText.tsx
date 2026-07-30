"use client";

import { useLanguage } from "./LanguageContext";

export function TaglineText() {
  const { translate } = useLanguage();

  return (
    <p
      className="text-violet-100/90 text-sm md:text-base max-w-xs leading-relaxed"
      style={{ animation: 'fadeInUp 0.6s ease-out 0.3s both' }}
    >
      {translate("tagline")}
    </p>
  );
}
