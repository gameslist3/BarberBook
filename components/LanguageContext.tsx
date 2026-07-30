"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Language, t } from "@/lib/i18n";

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  translate: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

/**
 * Reads the Google Translate cookie to determine the current language.
 * Cookie format: "googtrans=/en/bn" or "/en/hi" or "/en/en"
 */
function getLanguageFromCookie(): Language {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/googtrans=(?:\/[a-z]+\/)?([a-z]+)/);
  const lang = match?.[1];
  if (lang === "bn") return "bn";
  if (lang === "hi") return "hi";
  return "en";
}

/**
 * Sets the googtrans cookie and reloads the page to trigger Google Translate.
 */
function setGoogleTranslateLanguage(lang: Language) {
  document.cookie = `googtrans=/en/${lang}; path=/; max-age=31536000`;
  // Small delay allows React to flush the loading spinner before the page unloads
  setTimeout(() => window.location.reload(), 150);
}

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>("en");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // First check the googtrans cookie (Google Translate's state)
    const cookieLang = getLanguageFromCookie();
    setLanguageState(cookieLang);
    // Also save to localStorage for persistence across sessions
    localStorage.setItem("app_language", cookieLang);
    setIsLoaded(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("app_language", lang);
    // Trigger Google Translate via cookie + reload
    setGoogleTranslateLanguage(lang);
  };

  const translate = (key: string) => {
    return t(key as any, language);
  };

  if (!isLoaded) {
    return (
      <LanguageContext.Provider value={{ language, setLanguage, translate }}>
        <div style={{ visibility: 'hidden' }}>{children}</div>
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translate }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
