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

const siteUrl = "https://atena-lex.it";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Atena — Intelligenza Artificiale Giuridica",
    template: "%s | Atena",
  },
  description: "Ricerca giuridica intelligente con AI. Analisi normativa, drafting legale automatico e fact-checking su Costituzione, Codice Civile, Codice Penale e fonti EUR-Lex.",
  keywords: [
    "intelligenza artificiale legale",
    "ricerca giuridica AI",
    "diritto italiano",
    "codice civile",
    "codice penale",
    "costituzione italiana",
    "assistente legale AI",
    "legal AI Italia",
    "Atena",
    "ricerca semantica legale",
    "drafting legale automatico",
    "EUR-Lex",
  ],
  authors: [{ name: "Atena AI Legal Systems" }],
  creator: "Atena AI",
  publisher: "Atena AI Legal Systems",
  
  // Open Graph
  openGraph: {
    type: "website",
    locale: "it_IT",
    url: siteUrl,
    siteName: "Atena",
    title: "Atena — Intelligenza Artificiale Giuridica",
    description: "Ricerca giuridica intelligente con AI. Analisi normativa, drafting legale automatico e verifica fonti su tutto il corpus legislativo italiano ed europeo.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Atena — L'Intelligenza Artificiale Giuridica",
        type: "image/png",
      },
    ],
  },
  
  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "Atena — Intelligenza Artificiale Giuridica",
    description: "Ricerca giuridica intelligente con AI. Analisi normativa, drafting e fact-checking sul diritto italiano ed europeo.",
    images: ["/og-image.png"],
    creator: "@atena_lex",
  },
  
  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  
  // Icons
  icons: {
    icon: "/atena-logo-new.jpeg",
    apple: "/atena-logo-new.jpeg",
  },
  
  // Verification (add your IDs when ready)
  // verification: {
  //   google: "your-google-verification-code",
  // },
  
  // Alternate languages
  alternates: {
    canonical: siteUrl,
  },
  
  // Category
  category: "Legal Technology",
};

import DaemonDashboard from "@/components/stateful/DaemonDashboard";
import LegalDisclaimer from "@/components/ui/LegalDisclaimer";
import { Footer } from "@/components/ui/Footer";
import GenerativeBackground from "@/components/ui/GenerativeBackground";
import CookieConsent from "@/components/ui/CookieConsent";
import { Suspense } from "react";
import { PostHogProvider, PostHogPageview } from "@/components/providers/PostHogProvider";

// JSON-LD Structured Data
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Atena",
  "alternateName": "Atena AI",
  "url": siteUrl,
  "description": "Intelligenza artificiale giuridica per ricerca normativa, drafting legale e fact-checking sul diritto italiano ed europeo.",
  "applicationCategory": "LegalService",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "EUR",
    "description": "Piano gratuito con accesso base alla ricerca giuridica"
  },
  "creator": {
    "@type": "Organization",
    "name": "Atena AI Legal Systems",
    "url": siteUrl
  },
  "inLanguage": "it",
  "potentialAction": {
    "@type": "SearchAction",
    "target": `${siteUrl}/?q={search_term_string}`,
    "query-input": "required name=search_term_string"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className="light">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased min-h-screen flex flex-col bg-marble-50 text-slate-900 selection:bg-platinum-400/30 overflow-x-hidden`}
      >
        <Suspense fallback={null}>
          <PostHogPageview />
        </Suspense>
        
        <PostHogProvider>
          <GenerativeBackground />
          <main className="flex-grow z-10 relative">
            {children}
          </main>
          <Footer />
          <LegalDisclaimer />
          <DaemonDashboard />
          <CookieConsent />
        </PostHogProvider>
      </body>
    </html>
  );
}
