import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Atena Chat — Consulenza AI",
  description: "Consulta l'oracolo giuridico di Atena. Fai domande in linguaggio naturale e ricevi risposte accurate con citazioni dalle fonti ufficiali del diritto italiano.",
  openGraph: {
    title: "Atena Chat — Consulenza AI Giuridica",
    description: "L'oracolo giuridico: risposte AI precise con citazioni da Costituzione, Codice Civile, Codice Penale e EUR-Lex.",
    images: ["/og-image.png"],
  },
};

export default function AtenaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
