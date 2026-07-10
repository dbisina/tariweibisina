import { notFound } from "next/navigation";
import { SiteNav } from "@/components/site-nav";
import { CasePresentationView } from "@/components/case-presentation";
import { getCasePresentation } from "@/lib/case-studies";
import { ALL_PROJECTS } from "@/lib/projects";

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
      <SiteNav />
      <CasePresentationView data={data} />
    </div>
  );
}
