import { notFound } from "next/navigation";
import { SiteNav } from "@/components/site-nav";
import { CasePresentationView } from "@/components/case-presentation";
import { getCasePresentation, PITCH_DECKS } from "@/lib/case-studies";

const LINKS = [
  { label: "Catalog", href: "/business/catalog" },
  { label: "Pitch Decks", href: "/business/pitch-decks" },
  { label: "Hire Me", href: "/business/hire-me" },
  { label: "Contact", href: "/contact" },
];

export function generateStaticParams() {
  return PITCH_DECKS.map((slug) => ({ slug }));
}

export default async function PitchDeckPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!PITCH_DECKS.includes(slug)) notFound();
  const data = getCasePresentation(slug);
  if (!data) notFound();

  return (
    <div className="min-h-screen">
      <SiteNav links={LINKS} />
      <CasePresentationView data={data} />
    </div>
  );
}
