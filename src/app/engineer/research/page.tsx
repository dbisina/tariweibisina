import { SiteNav } from "@/components/site-nav";

/** Placeholder entries until the CMS (task #9) supplies real research
 * writing — structure mirrors the engineering project list. */
const ENTRIES = [
  {
    index: "01",
    title: "Scheduling LLM inference on consumer GPUs",
    tag: "GPU · RUNTIME",
    status: "IN PROGRESS",
  },
  {
    index: "02",
    title: "Agent handoff protocols under partial context",
    tag: "AGENTS · SYSTEMS",
    status: "DRAFT",
  },
  {
    index: "03",
    title: "AI-native OS primitives: models as processes",
    tag: "OPERATING SYSTEMS",
    status: "NOTES",
  },
];

export default function ResearchPage() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-5xl px-6 pt-40 pb-32 md:px-10">
        <p className="font-mono text-[10px] tracking-[0.24em] text-acc">FOR ENGINEERS</p>
        <h1 className="mt-4 font-display text-[clamp(2.5rem,7vw,5.5rem)] font-medium leading-[0.95] tracking-tight text-ink">
          Research.
        </h1>
        <p className="mt-6 max-w-xl font-sans text-lg text-mut">
          Working notes and longer investigations. The unpolished thinking behind the
          shipped systems.
        </p>

        <div className="mt-16 border-t border-ln">
          {ENTRIES.map((e) => (
            <div
              key={e.index}
              className="grid grid-cols-[52px_1fr_auto] items-center gap-4 border-b border-ln py-7"
            >
              <span className="font-mono text-xs text-mut">{e.index}</span>
              <span>
                <span className="block font-display text-[clamp(20px,2.6vw,32px)] font-medium leading-[1.1] tracking-tight text-ink">
                  {e.title}
                </span>
                <span className="mt-1 block font-mono text-[10.5px] tracking-[0.16em] text-mut">
                  {e.tag}
                </span>
              </span>
              <span className="rounded-full border border-ln px-3 py-1 font-mono text-[9.5px] tracking-[0.14em] text-mut">
                {e.status}
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
