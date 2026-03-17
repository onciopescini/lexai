import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Atena — La Dea Moderna della Legge",
  description: "Atena - Assistente Avanzato per la Ricerca Giuridica e l'Analisi Normativa.",
  keywords: "Atena, diritto italiano, ricerca legale, intelligenza artificiale, AI legale, ricerca semantica",
  authors: [{ name: "Atena Team" }],
  openGraph: {
    title: "Atena — La Dea Moderna della Legge",
    description: "Atena - Assistente Avanzato per la Ricerca Giuridica e l'Analisi Normativa.",
    type: "website",
    locale: "it_IT",
  },
  robots: {
    index: true,
    follow: true,
  },
};

import DaemonDashboard from "@/components/stateful/DaemonDashboard";
import LegalDisclaimer from "@/components/ui/LegalDisclaimer";
import { Footer } from "@/components/ui/Footer";
import GenerativeBackground from "@/components/ui/GenerativeBackground";
import CookieConsent from "@/components/ui/CookieConsent";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased min-h-screen flex flex-col bg-obsidian-950 text-slate-100 selection:bg-gold-500/30 overflow-x-hidden`}
      >
        <GenerativeBackground />
        <main className="flex-grow z-10 relative">
          {children}
        </main>
        <Footer />
        <LegalDisclaimer />
        <DaemonDashboard />
        <CookieConsent />
      </body>
    </html>
  );
}

