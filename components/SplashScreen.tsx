"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SPLASH_KEY = "bb_splash_seen";

export function SplashScreen({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window === "undefined") return true;
    return !sessionStorage.getItem(SPLASH_KEY);
  });

  useEffect(() => {
    if (!showSplash) return;
    const timer = setTimeout(() => {
      sessionStorage.setItem(SPLASH_KEY, "1");
      setShowSplash(false);
    }, 4500);
    return () => clearTimeout(timer);
  }, [showSplash]);

  const handleVideoEnd = () => {
    sessionStorage.setItem(SPLASH_KEY, "1");
    setShowSplash(false);
  };

  return (
    <>
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="fixed inset-0 z-[9999] bg-white dark:bg-gray-900 flex items-center justify-center"
          >
            <video
              autoPlay
              muted
              playsInline
              onEnded={handleVideoEnd}
              className="w-full h-full object-contain max-w-lg"
              style={{ maxWidth: "100vw", maxHeight: "100vh" }}
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
