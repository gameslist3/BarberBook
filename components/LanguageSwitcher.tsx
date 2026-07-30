"use client";

import React, { useState } from "react";
import { useLanguage } from "./LanguageContext";
import { Globe, Check } from "lucide-react";
import { Language } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const languages: { code: Language; label: string }[] = [
    { code: "en", label: "English" },
    { code: "bn", label: "বাংলা" },
    { code: "hi", label: "हिन्दी" },
  ];

  const handleChangeLanguage = (code: Language) => {
    if (code === language) {
      setIsOpen(false);
      return;
    }
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
        title="Change Language"
      >
        <Globe size={18} />
        <span className="text-xs font-semibold">
          {languages.find(l => l.code === language)?.label || language}
        </span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden animate-fadeIn">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleChangeLanguage(lang.code)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-violet-50 transition-colors flex items-center justify-between"
              >
                <span className={language === lang.code ? "text-violet-600 font-bold" : "text-gray-700"}>
                  {lang.label}
                </span>
                {language === lang.code && <Check size={14} className="text-violet-600" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
