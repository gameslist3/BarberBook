import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SplashScreen } from "@/components/SplashScreen";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BarberBook",
  description: "Book your next haircut with ease.",
  icons: {
    icon: "/fav.png",
    apple: "/fav.png",
    shortcut: "/fav.png",
  },
};

import { LanguageProvider } from "@/components/LanguageContext";
import { GoogleTranslateInit } from "@/components/GoogleTranslateInit";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <GoogleTranslateInit />
        <LanguageProvider>
          <SplashScreen>
            {children}
          </SplashScreen>
        </LanguageProvider>
      </body>
    </html>
  );
}
