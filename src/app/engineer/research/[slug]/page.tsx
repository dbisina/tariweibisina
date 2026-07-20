import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { RESEARCH_ENTRIES, researchBySlug } from "@/lib/research";
import { ResearchDetail } from "./research-detail";
import { jsonLdScript, articleJsonLd, breadcrumbJsonLd } from "@/lib/seo";

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

  return (
    <div className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(articleJsonLd(entry))} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Research", path: "/engineer/research" },
            { name: entry.title, path: `/engineer/research/${slug}` },
          ])
        )}
      />
      <SiteNav />
      <main className="mx-auto max-w-[1500px] px-4 pt-40 pb-32 md:px-6">
        <Link
          href="/engineer/research"
          className="font-mono text-[11px] tracking-[0.16em] text-mut transition-colors hover:text-acc"
        >
          ← ALL RESEARCH
        </Link>

        <ResearchDetail seed={entry} index={index} />
      </main>
      <SiteFooter />
    </div>
  );
}
