import { SiteNav } from "@/components/site-nav";

/** Placeholder entries until the CMS (task #9) supplies the real record —
 * Daniel adds his actual hackathons there. */
const ENTRIES = [
  {
    index: "01",
    title: "48h build — agent ops console",
    tag: "TEAM OF 2 · SHIPPED DEMO",
    result: "FINALIST",
  },
  {
    index: "02",
    title: "GPU kernel golf night",
    tag: "SOLO · CUDA",
    result: "TOP 10",
  },
  {
    index: "03",
    title: "Campus AI sprint — StudyRAG origin",
    tag: "TEAM OF 3 · BECAME A PRODUCT",
    result: "WINNER",
  },
];

export default function HackathonsPage() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-5xl px-6 pt-40 pb-32 md:px-10">
        <p className="font-mono text-[10px] tracking-[0.24em] text-acc">FOR ENGINEERS</p>
        <h1 className="mt-4 font-display text-[clamp(2.5rem,7vw,5.5rem)] font-medium leading-[0.95] tracking-tight text-ink">
          Hackathons.
        </h1>
        <p className="mt-6 max-w-xl font-sans text-lg text-mut">
          Where half of the systems started: a deadline, a team, and no time to
          overthink.
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
              <span className="rounded-full border border-acc/40 px-3 py-1 font-mono text-[9.5px] tracking-[0.14em] text-acc">
                {e.result}
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
