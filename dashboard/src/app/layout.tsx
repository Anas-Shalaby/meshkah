// @ts-nocheck
import React from "react";
import {
  Tajawal,
  IBM_Plex_Sans_Arabic as IBMPlexSansArabic,
  Inconsolata,
} from "next/font/google";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  display: "swap",
  weight: ["500", "700"],
  variable: "--font-display",
});

const plexArabic = IBMPlexSansArabic({
  subsets: ["arabic"],
  display: "swap",
  weight: ["400", "500", "600"],
  variable: "--font-arabic",
});

const inconsolata = Inconsolata({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Meshkah - لوحة التحكم",
  description: "لوحة تحكم مشكاة الحديث الشريف",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${tajawal.variable} ${plexArabic.variable} ${inconsolata.variable} font-arabic`}
    >
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
