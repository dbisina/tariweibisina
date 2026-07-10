import { notFound } from "next/navigation";
import { SiteNav } from "@/components/site-nav";
import { CasePresentationView } from "@/components/case-presentation";
import { getCasePresentation } from "@/lib/case-studies";
import { ALL_PROJECTS } from "@/lib/projects";

const LINKS = [
  { label: "Catalog", href: "/business/catalog" },
  { label: "Pitch Decks", href: "/business/pitch-decks" },
  { label: "Hire Me", href: "/business/hire-me" },
  { label: "Contact", href: "/contact" },
];

export function generateStaticParams() {
  return ALL_PROJECTS.map((p) => ({ slug: p.slug }));
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = getCasePresentation(slug);
  if (!data) notFound();

  return (
    <div className="min-h-screen">
      <SiteNav links={LINKS} />
      <CasePresentationView data={data} />
    </div>
  );
}
