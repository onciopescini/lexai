import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Civic Lessons — Educazione Giuridica",
  description: "Lezioni interattive di diritto italiano. Scopri i tuoi diritti fondamentali, il funzionamento della giustizia e le basi del diritto civile e penale.",
  openGraph: {
    title: "Civic Lessons — Educazione Giuridica | Atena",
    description: "Lezioni interattive per conoscere i tuoi diritti e le basi del diritto italiano.",
    images: ["/og-image.png"],
  },
};

export default function LessonsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
