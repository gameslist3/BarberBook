import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SplashScreen } from "@/components/SplashScreen";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BarberBook",
  description: "Book your next haircut with ease.",
  manifest: "/manifest.json",
  themeColor: "#000000",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black",
    title: "BarberBook",
  },
  icons: {
    icon: "/fav.png",
    apple: "/icons/icon-192x192.png",
    shortcut: "/fav.png",
  },
};

import { LanguageProvider } from "@/components/LanguageContext";
import { GoogleTranslateInit } from "@/components/GoogleTranslateInit";
import { SWRegister } from "@/components/SWRegister";
import { NotificationPrompt } from "@/components/NotificationPrompt";
import { NotificationListener } from "@/components/NotificationListener";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <GoogleTranslateInit />
        <SWRegister />
        <NotificationListener />
        <NotificationPrompt />
        <LanguageProvider>
          <SplashScreen>
            {children}
          </SplashScreen>
        </LanguageProvider>
      </body>
    </html>
  );
}
