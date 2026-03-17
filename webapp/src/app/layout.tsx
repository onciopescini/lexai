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
  description: "Atena - Piattaforma Sperimentale di Analisi Giuridica tramite IA. Motore di ricerca documentale per il Diritto Italiano.",
  keywords: "Atena, diritto italiano, ricerca legale, intelligenza artificiale, codice civile, costituzione italiana, AI legale, ricerca semantica",
  authors: [{ name: "Atena Team" }],
  openGraph: {
    title: "Atena — AI Legal Intelligence",
    description: "Atena - Piattaforma Sperimentale di Analisi Giuridica tramite IA. Motore di ricerca documentale per il Diritto Italiano.",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <GenerativeBackground />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
        <LegalDisclaimer />
        <DaemonDashboard />
      </body>
    </html>
  );
}
