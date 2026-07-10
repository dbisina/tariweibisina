import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { getCasePresentation, PITCH_DECKS } from "@/lib/case-studies";

export default function PitchDecksPage() {
  const decks = PITCH_DECKS.map((slug) => getCasePresentation(slug)).filter(
    (d): d is NonNullable<typeof d> => d !== null
  );

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-5xl px-6 pt-40 pb-32 md:px-10">
        <p className="font-mono text-[10px] tracking-[0.24em] text-acc">FOR INVESTORS</p>
        <h1 className="mt-4 font-display text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.95] tracking-tight text-ink">
          Pitch decks.
        </h1>
        <p className="mt-6 max-w-xl font-sans text-lg text-mut">
          The ventures, presented the way the projects are: full pages, real numbers, and a
          direct line to Daniel.
        </p>

        <div className="mt-16 space-y-4">
          {decks.map((d) => (
            <Link
              key={d.slug}
              href={`/business/pitch-decks/${d.slug}`}
              className="group flex items-baseline justify-between border-b border-ln py-8"
            >
              <div>
                <span className="font-mono text-[10px] tracking-[0.2em] text-mut">
                  {d.eyebrow}
                </span>
                <h2 className="mt-2 font-display text-3xl text-ink transition-colors group-hover:text-acc md:text-5xl">
                  {d.title}
                </h2>
              </div>
              <span className="font-mono text-xs text-acc">VIEW →</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
