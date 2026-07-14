import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { DecksList } from "./decks-list";

export default function PitchDecksPage() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-[1680px] px-4 pt-40 pb-32 md:px-6">
        <p className="font-mono text-[10px] tracking-[0.24em] text-acc">FOR INVESTORS</p>
        <h1 className="mt-4 font-display text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.95] tracking-tight text-ink">
          Pitch decks.
        </h1>
        <p className="mt-6 max-w-xl font-sans text-lg text-mut">
          The ventures, presented the way the projects are: full pages, real numbers, and a
          direct line to Daniel.
        </p>

        <DecksList />
      </main>
      <SiteFooter />
    </div>
  );
}
