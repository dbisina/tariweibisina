import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { RESEARCH_ENTRIES, researchBySlug } from "@/lib/research";

export function generateStaticParams() {
  return RESEARCH_ENTRIES.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = researchBySlug(slug);
  if (!entry) return {};
  return {
    title: entry.title,
    description: entry.summary,
    alternates: { canonical: `/engineer/research/${slug}` },
    openGraph: { title: entry.title, description: entry.summary, url: `/engineer/research/${slug}` },
    twitter: { title: entry.title, description: entry.summary },
  };
}

/** Continues the orientation its list card used — even index: image left,
 * text right; odd (inverted): image right, text left. Entirely on-site,
 * no external links. */
export default async function ResearchDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = researchBySlug(slug);
  if (!entry) notFound();

  const index = RESEARCH_ENTRIES.findIndex((r) => r.slug === slug);
  const inverted = index % 2 === 1;

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-[1500px] px-4 pt-40 pb-32 md:px-6">
        <Link
          href="/engineer/research"
          className="font-mono text-[11px] tracking-[0.16em] text-mut transition-colors hover:text-acc"
        >
          ← ALL RESEARCH
        </Link>

        <div
          className={`mt-10 grid grid-cols-1 items-start gap-10 md:grid-cols-2 md:gap-16 ${
            inverted ? "md:[&>*:first-child]:order-2" : ""
          }`}
        >
          <div
            className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-cover bg-center md:sticky md:top-32"
            style={{ backgroundImage: `url(${entry.image})` }}
          />
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] tracking-[0.16em] text-acc">{entry.tag}</span>
              <span className="font-mono text-[10px] tracking-[0.14em] text-mut">{entry.publication}</span>
            </div>
            <h1 className="mt-4 font-display text-3xl font-medium leading-[1.05] tracking-tight text-ink md:text-5xl">
              {entry.title}
            </h1>
            <p className="mt-6 font-sans text-lg leading-relaxed text-mut">{entry.summary}</p>
            <div className="mt-10 space-y-6 border-t border-ln pt-10">
              {entry.body.map((para, i) => (
                <p key={i} className="font-sans text-[15px] leading-relaxed text-ink/90">
                  {para}
                </p>
              ))}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
