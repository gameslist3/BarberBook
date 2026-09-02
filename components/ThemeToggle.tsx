"use client";

import { useTheme } from "./ThemeProvider";
import { Sun, Moon, Laptop } from "lucide-react";

interface ThemeToggleProps {
  variant?: "icon" | "segmented" | "glass";
  className?: string;
}

export function ThemeToggle({ variant = "icon", className = "" }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  if (variant === "segmented") {
    const options: { key: "light" | "dark" | "system"; label: string; icon: any }[] = [
      { key: "light", label: "Light", icon: Sun },
      { key: "dark", label: "Dark", icon: Moon },
      { key: "system", label: "System", icon: Laptop },
    ];

    return (
      <div className={`inline-flex p-1 rounded-2xl bg-gray-100 dark:bg-gray-800/80 border border-gray-200/60 dark:border-gray-700/60 ${className}`}>
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = theme === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => setTheme(opt.key)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                isActive
                  ? "bg-white dark:bg-gray-700 text-violet-600 dark:text-violet-400 shadow-sm font-semibold scale-100"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <Icon size={14} className={isActive ? "text-violet-600 dark:text-violet-400" : ""} />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Toggle between light and dark
  const handleToggle = () => {
    if (resolvedTheme === "dark") {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  };

  if (variant === "glass") {
    return (
      <button
        type="button"
        onClick={handleToggle}
        title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
        aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
        className={`relative p-2.5 rounded-full bg-white/20 dark:bg-black/30 backdrop-blur-md border border-white/30 dark:border-white/10 text-white shadow-sm hover:bg-white/30 dark:hover:bg-black/40 active:scale-95 transition-all duration-200 cursor-pointer ${className}`}
      >
        <div className="relative w-5 h-5 flex items-center justify-center">
          {resolvedTheme === "dark" ? (
            <Sun size={18} className="text-amber-300 transition-transform duration-300 rotate-0 hover:rotate-45" />
          ) : (
            <Moon size={18} className="text-white transition-transform duration-300 -rotate-12 hover:rotate-0" />
          )}
        </div>
      </button>
    );
  }

  // Standard M3 Icon Button
  return (
    <button
      type="button"
      onClick={handleToggle}
      title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
      aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
      className={`p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200 transition-all duration-200 active:scale-95 cursor-pointer ${className}`}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {resolvedTheme === "dark" ? (
          <Sun size={19} className="text-amber-400 transition-transform duration-300 hover:rotate-45" />
        ) : (
          <Moon size={19} className="text-violet-600 transition-transform duration-300 hover:-rotate-12" />
        )}
      </div>
    </button>
  );
}
