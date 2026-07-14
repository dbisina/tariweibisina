import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PitchDeckPage as PitchDeckPageClient } from "./pitch-deck-page";
import { SEED_PITCHES, seedBySlug } from "@/lib/content";
import { jsonLdScript, projectJsonLd, breadcrumbJsonLd } from "@/lib/seo";

export function generateStaticParams() {
  return SEED_PITCHES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const seed = seedBySlug(slug);
  if (!seed || !seed.pitch) return {};
  const title = `${seed.name} Pitch Deck`;
  const description = seed.pitch.tagline || seed.oneLiner;
  return {
    title,
    description,
    alternates: { canonical: `/business/pitch-decks/${slug}` },
    openGraph: {
      title,
      description,
      url: `/business/pitch-decks/${slug}`,
      type: "article",
      images: [{ url: seed.image, width: 1024, height: 704, alt: seed.name }],
    },
    twitter: { title, description, images: [seed.image] },
  };
}

export default async function PitchDeckPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const seed = seedBySlug(slug);
  if (!seed || !seed.pitch) notFound();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(projectJsonLd(seed))} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Pitch Decks", path: "/business/pitch-decks" },
            { name: seed.name, path: `/business/pitch-decks/${slug}` },
          ])
        )}
      />
      <PitchDeckPageClient seed={seed} />
    </>
  );
}
