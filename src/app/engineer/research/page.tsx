import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ResearchList } from "./research-list";

/**
 * Research list — alternating cards, whole card clickable to its own
 * internal detail page (never an external reference).
 */
export default function ResearchPage() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-[1500px] px-4 pt-40 pb-32 md:px-6">
        <p className="font-mono text-[10px] tracking-[0.24em] text-acc">FOR ENGINEERS</p>
        <h1 className="mt-4 font-display text-[clamp(2.5rem,7vw,5.5rem)] font-medium leading-[0.95] tracking-tight text-ink">
          Research.
        </h1>
        <p className="mt-6 max-w-xl font-sans text-lg text-mut">
          Working notes and longer investigations — the unpolished thinking behind the shipped
          systems.
        </p>

        <ResearchList />
      </main>
      <SiteFooter />
    </div>
  );
}
