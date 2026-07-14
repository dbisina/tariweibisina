import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { CaseCount, CaseGrid } from "./case-grid";

/**
 * Business PROJECTS — the presentational view (podium/semler language): every
 * business-side project as a large editorial card that opens its full case
 * presentation. Reads the live Studio roster so adding, editing or removing a
 * project in /studio is reflected here immediately. The raw, no-narrative index
 * of all work lives at /catalog instead.
 */
export default function BusinessProjectsPage() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-[1800px] px-4 pt-40 pb-24 md:px-6 md:pt-48">
        <p className="font-mono text-[11px] tracking-[0.24em] text-acc">
          BUSINESS · <CaseCount /> CASE STUDIES
        </p>
        <h1
          className="mt-5 font-display font-medium leading-[0.94] tracking-[-0.035em] text-ink"
          style={{ fontSize: "clamp(2.8rem, 8vw, 6.5rem)" }}
        >
          The work, <span className="font-accent italic font-normal">presented.</span>
        </h1>
        <p className="mt-6 max-w-xl font-sans text-lg leading-relaxed text-mut">
          Each one a full case: the problem, what got built, the live thing. Want the raw
          index with no narrative?{" "}
          <Link href="/catalog" className="text-ink underline underline-offset-4 hover:text-acc">
            See the catalog.
          </Link>
        </p>

        <CaseGrid />
      </main>
      <SiteFooter />
    </div>
  );
}
