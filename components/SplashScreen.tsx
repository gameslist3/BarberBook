"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function SplashScreen({ children }: { children: React.ReactNode }) {
  // Initialize synchronously so the splash is shown immediately on first session load
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window === "undefined") return false;
    const seen = sessionStorage.getItem("splash_seen");
    if (!seen) {
      sessionStorage.setItem("splash_seen", "true");
      return true;
    }
    return false;
  });

  // Fallback in case video doesn't end properly, takes too long to load, or user skips
  useEffect(() => {
    if (!showSplash) return;
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 6000); // 6 seconds max fallback
    return () => clearTimeout(timer);
  }, [showSplash]);

  return (
    <>
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[9999] bg-white flex items-center justify-center"
          >
            <video
              autoPlay
              muted
              playsInline
              onEnded={() => setShowSplash(false)}
              className="w-full h-full object-cover sm:object-contain max-w-3xl"
            >
              <source src="/logo video.mp4" type="video/mp4" />
            </video>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </>
  );
}
