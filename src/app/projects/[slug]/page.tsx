import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/site-nav";
import { ProjectDetail } from "@/components/project-detail";
import { SEED_PROJECTS, seedBySlug } from "@/lib/content";
import { jsonLdScript, projectJsonLd, breadcrumbJsonLd } from "@/lib/seo";

export function generateStaticParams() {
  return SEED_PROJECTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const seed = seedBySlug(slug);
  if (!seed) return {};
  const title = seed.name;
  const description = seed.oneLiner;
  return {
    title,
    description,
    alternates: { canonical: `/projects/${slug}` },
    openGraph: {
      title,
      description,
      url: `/projects/${slug}`,
      type: "article",
      images: [{ url: seed.image, width: 1024, height: 704, alt: seed.name }],
    },
    twitter: { title, description, images: [seed.image] },
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const seed = seedBySlug(slug);
  if (!seed) notFound();

  return (
    <div className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(projectJsonLd(seed))} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Catalog", path: "/catalog" },
            { name: seed.name, path: `/projects/${slug}` },
          ])
        )}
      />
      <SiteNav />
      <ProjectDetail seed={seed} mode="case" />
    </div>
  );
}
