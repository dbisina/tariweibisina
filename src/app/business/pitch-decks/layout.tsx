import type { Metadata } from "next";

const TITLE = "Pitch Decks";
const DESCRIPTION =
  "Daniel Tariwei Bisina's ventures, presented for investors — full pages, real numbers, and a direct line.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/business/pitch-decks" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/business/pitch-decks" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function PitchDecksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
