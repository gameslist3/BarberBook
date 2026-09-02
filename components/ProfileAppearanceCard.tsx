"use client";

import { useTheme } from "./ThemeProvider";
import { Sun, Moon, Laptop, Palette } from "lucide-react";

export function ProfileAppearanceCard() {
  const { theme, setTheme } = useTheme();

  const options: { key: "light" | "dark" | "system"; label: string; icon: any; desc: string }[] = [
    { key: "light", label: "Light", icon: Sun, desc: "Clean, bright display" },
    { key: "dark", label: "Dark", icon: Moon, desc: "Easy on the eyes in low light" },
    { key: "system", label: "System", icon: Laptop, desc: "Matches your device setting" },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 mt-6 transition-colors">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 rounded-xl">
          <Palette size={20} />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Appearance</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Choose how BarberBook looks to you</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = theme === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => setTheme(opt.key)}
              className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border text-center transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "border-violet-600 bg-violet-50/50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 ring-2 ring-violet-500/20"
                  : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/40 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700"
              }`}
            >
              <Icon size={20} className={`mb-2 ${isSelected ? "text-violet-600 dark:text-violet-400" : "text-gray-500 dark:text-gray-400"}`} />
              <span className="text-xs sm:text-sm font-semibold">{opt.label}</span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 hidden sm:block">{opt.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
