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
 * Reads the preferred language from localStorage, falling back to "en".
 */
function getInitialLanguage(): Language {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem("app_language") as Language | null;
  if (stored === "bn" || stored === "hi") return stored;
  const match = document.cookie.match(/googtrans=(?:\/[a-z]+\/)?([a-z]+)/);
  const lang = match?.[1];
  if (lang === "bn") return "bn";
  if (lang === "hi") return "hi";
  return "en";
}

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>("en");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const initialLang = getInitialLanguage();
    setLanguageState(initialLang);
    setIsLoaded(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("app_language", lang);
    // Set Google Translate cookie then reload to apply site-wide translation
    document.cookie = `googtrans=/en/${lang}; path=/; max-age=31536000`;
    window.location.reload();
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
