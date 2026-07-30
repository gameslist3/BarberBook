"use client";

import { useEffect } from "react";

/**
 * Client component that initializes the Google Translate widget.
 *
 * Why this must be a separate client component:
 *   - React does not execute <script> tags rendered via JSX (throws console errors).
 *   - Google Translate injects DOM elements into the container, causing hydration
 *     mismatches if the container is rendered by a server component.
 *
 * This component injects the script dynamically in useEffect and only renders
 * the hidden container div on the client, avoiding both issues.
 */
export function GoogleTranslateInit() {
  useEffect(() => {
    // 1. Define the global callback BEFORE loading the script
    (window as any).googleTranslateElementInit = () => {
      try {
        new (window as any).google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "en,bn,hi",
            layout: (window as any).google.translate.TranslateElement
              .InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          "google_translate_element",
        );
      } catch {
        // Google Translate SDK may not be available (blocked by ad-blocker / region)
        console.warn("Google Translate failed to initialise.");
      }
    };

    // 2. Dynamically append the Google Translate script
    const script = document.createElement("script");
    script.src =
      "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup on unmount
      const existing = document.querySelector(
        'script[src*="translate.google.com"]',
      );
      if (existing) existing.remove();
    };
  }, []);

  return (
    <>
      {/* Hidden container – Google Translate injects its iframe here */}
      <div id="google_translate_element" style={{ display: "none" }}></div>

      {/* Styles to hide every piece of Google's default UI */}
      <style>{`
        .goog-te-banner-frame,
        .goog-te-menu-frame,
        .goog-te-gadget-simple,
        .goog-te-gadget,
        .goog-te-gadget-icon,
        .goog-te-balloon-frame,
        .goog-te-spinner-pos,
        .goog-te-spinner,
        .goog-te-combo,
        iframe.goog-te-banner-frame,
        iframe[src*="translate.google.com"],
        .goog-te-menu-value,
        .goog-te-menu,
        .VIpgJd-ZVi9od-ORHb,
        .VIpgJd-ZVi9od-aZ2wEe-wOHMyf,
        .VIpgJd-ZVi9od-TvD9Pc-hSRGPd,
        #google_translate_element,
        .skiptranslate,
        .skiptranslate > iframe {
          display: none !important;
          visibility: hidden !important;
          height: 0px !important;
          width: 0px !important;
          overflow: hidden !important;
          position: absolute !important;
          clip: rect(0,0,0,0) !important;
        }
        body {
          top: 0px !important;
        }
        .goog-te-spinner-pos {
          display: none !important;
        }
      `}</style>
    </>
  );
}
