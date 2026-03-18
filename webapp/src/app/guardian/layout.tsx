import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Guardian Radar — Monitoraggio Legislativo",
  description: "Monitora in tempo reale le novità legislative italiane ed europee. Ricevi alert automatici su modifiche normative rilevanti per la tua area di interesse.",
  openGraph: {
    title: "Guardian Radar — Monitoraggio Legislativo | Atena",
    description: "Monitora in tempo reale le novità legislative italiane ed europee con alert automatici personalizzati.",
    images: ["/og-image.png"],
  },
};

export default function GuardianLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
