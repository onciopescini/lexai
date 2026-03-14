import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Atena — AI Legal Intelligence per il Diritto Italiano",
  description: "Il motore di ricerca semantico definitivo per il Diritto Italiano. Interroga Costituzione, Codice Civile, Normattiva e fonti ufficiali usando il linguaggio naturale con Intelligenza Artificiale.",
  keywords: "Atena, diritto italiano, ricerca legale, intelligenza artificiale, codice civile, costituzione italiana, AI legale, ricerca semantica",
  authors: [{ name: "Atena Team" }],
  openGraph: {
    title: "Atena — AI Legal Intelligence",
    description: "Il motore di ricerca semantico definitivo per il Diritto Italiano. Intelligenza Artificiale al servizio della giustizia.",
    type: "website",
    locale: "it_IT",
  },
  robots: {
    index: true,
    follow: true,
  },
};

import DaemonDashboard from "@/components/DaemonDashboard";
import LegalDisclaimer from "@/components/LegalDisclaimer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <LegalDisclaimer />
        <DaemonDashboard />
      </body>
    </html>
  );
}
