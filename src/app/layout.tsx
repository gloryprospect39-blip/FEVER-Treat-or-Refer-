import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Noto_Sans_Myanmar } from "next/font/google";

import { mm } from "@/lib/i18n/mm";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoMyanmar = Noto_Sans_Myanmar({
  variable: "--font-noto-myanmar",
  subsets: ["myanmar"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: mm.app.metaTitle,
  description: mm.app.metaDescription,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="my"
      className={`${geistSans.variable} ${geistMono.variable} ${notoMyanmar.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gradient-to-b from-slate-50 via-white to-teal-50/30 font-sans text-slate-900">
        {children}
      </body>
    </html>
  );
}
