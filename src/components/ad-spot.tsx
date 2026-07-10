/**
 * Sponsorship slot — deliberately quiet: token colors, hairline border,
 * clear SPONSORED marking, one mailto CTA. The CMS (task #9) later swaps
 * this placeholder for a booked creative.
 */
export function AdSpot() {
  return (
    <section className="w-full px-6 py-14 md:px-10">
      <div className="mx-auto max-w-6xl">
        <a
          href="mailto:danbis664@gmail.com?subject=Ad%20placement%20on%20tariwei"
          className="group flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed border-ln px-6 py-5 transition-colors hover:border-acc md:px-8"
        >
          <div className="flex items-center gap-5">
            <span className="rounded-full border border-ln px-2.5 py-1 font-mono text-[9px] tracking-[0.22em] text-mut">
              SPONSORED
            </span>
            <span className="font-sans text-[15px] text-mut">
              This space is reserved for a partner.{" "}
              <span className="text-ink">Your brand could live here.</span>
            </span>
          </div>
          <span className="font-mono text-[10.5px] tracking-[0.16em] text-acc">
            PLACE AN AD ↗
          </span>
        </a>
      </div>
    </section>
  );
}
