"use client";

import { useRouter } from "next/navigation";
import { useSiteStore, type Path } from "@/lib/store";

/**
 * THE CROSSROADS — direct port of the reference prototype's door portals
 * (Tariwei.dc.html #crossroads): two arched doorway cards tilted toward
 * each other, spinning conic rim light, interior imagery dimmed under a
 * gradient, DOOR 01/02 labels, STEP THROUGH cta, floor shadow and
 * realm:// captions.
 */

const DOORS: {
  path: Path;
  href: string;
  door: string;
  title: [string, string];
  copy: string;
  caption: string;
  image: string;
  tilt: number;
}[] = [
  {
    path: "engineer",
    href: "/engineer",
    door: "DOOR 01",
    title: ["Enter as", "an engineer"],
    copy: "Protocols, kernels, system design, research and hackathons. Proof of competence.",
    caption: "realm://engineering",
    image: "https://picsum.photos/seed/tariwei-door-eng/900/1500",
    tilt: 8,
  },
  {
    path: "business",
    href: "/business",
    door: "DOOR 02",
    title: ["Enter as a", "business owner"],
    copy: "Problems, solutions, live demos and the numbers that moved. Proof of impact.",
    caption: "realm://business",
    image: "https://picsum.photos/seed/tariwei-door-biz/900/1500",
    tilt: -8,
  },
];

export function PathSelect() {
  const router = useRouter();

  return (
    <section className="w-full px-6 pb-28 pt-28 md:px-10 md:pb-36 md:pt-40">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="anim-fade-up font-mono text-[11px] tracking-[0.24em] text-acc">
            THE CROSSROADS
          </p>
          <h2
            className="anim-fade-up mx-auto mt-4 font-display font-medium leading-none tracking-[-0.03em] text-ink"
            style={{ fontSize: "clamp(38px, 5.4vw, 76px)", animationDelay: "0.1s" }}
          >
            Choose your <span className="font-accent italic font-normal">portal.</span>
          </h2>
          <p
            className="anim-fade-up mx-auto mt-3 max-w-md font-sans text-[15px] leading-relaxed text-mut"
            style={{ animationDelay: "0.2s" }}
          >
            Same engineer, two languages. Pick the one you speak — you can always cross over.
          </p>
        </div>

        <div
          className="mt-16 flex flex-wrap items-start justify-center gap-[clamp(32px,6vw,96px)]"
          style={{ perspective: "2200px" }}
        >
          {DOORS.map((d) => (
            <div key={d.path} className="anim-fade-up" style={{ animationDelay: "0.25s" }}>
              <button
                type="button"
                onClick={() => {
                  useSiteStore.getState().setPath(d.path);
                  router.push(d.href);
                }}
                className="group relative block w-[min(380px,80vw)] cursor-pointer border-0 bg-transparent p-0 text-left"
                style={{
                  transform: `rotateY(${d.tilt}deg)`,
                  transition: "transform 0.7s cubic-bezier(0.22, 0.7, 0.16, 1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "rotateY(0deg) translateY(-6px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = `rotateY(${d.tilt}deg)`;
                }}
              >
                {/* arch frame with spinning rim light */}
                <span className="relative block overflow-hidden rounded-t-full rounded-b-[22px] bg-ln p-0.5">
                  <span
                    aria-hidden
                    className="absolute -inset-[55%] animate-[spin_7s_linear_infinite]"
                    style={{
                      background:
                        "conic-gradient(from 0deg, transparent 0deg, transparent 62deg, var(--acc) 112deg, transparent 162deg, transparent 242deg, rgba(255,90,44,0.45) 292deg, transparent 342deg)",
                    }}
                  />
                  <span className="relative block overflow-hidden rounded-t-full rounded-b-[20px] bg-[#08080a]">
                    <span className="relative block" style={{ aspectRatio: "0.6" }}>
                      <span
                        className="absolute inset-0 bg-cover bg-center opacity-50 transition-all duration-700 group-hover:scale-105 group-hover:opacity-70"
                        style={{
                          backgroundImage: `url(${d.image})`,
                          filter: "grayscale(0.3) contrast(1.08)",
                        }}
                      />
                      <span
                        className="absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(180deg, rgba(5,5,6,0.45) 0%, rgba(5,5,6,0.05) 40%, rgba(5,5,6,0.9) 84%)",
                        }}
                      />
                      <span className="absolute inset-0 flex flex-col items-center justify-between px-7 pb-9 pt-11 text-center">
                        <span className="font-mono text-[10px] tracking-[0.26em] text-[#f4f3ef]/65">
                          {d.door}
                        </span>
                        <span>
                          <span
                            className="block font-display font-medium leading-[1.02] tracking-[-0.02em] text-[#f4f3ef]"
                            style={{ fontSize: "clamp(30px, 3.4vw, 42px)" }}
                          >
                            {d.title[0]}
                            <br />
                            {d.title[1]}
                          </span>
                          <span className="mx-auto mt-3.5 block max-w-[280px] font-sans text-[13.5px] leading-relaxed text-[#f4f3ef]/60">
                            {d.copy}
                          </span>
                          <span className="mt-5 inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] text-acc">
                            STEP THROUGH <span>→</span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>
                </span>
              </button>

              {/* floor shadow + caption */}
              <div
                className="mx-auto mt-5 h-4 w-[70%] rounded-full"
                style={{
                  background:
                    "radial-gradient(ellipse at center, rgba(0,0,0,0.45), transparent 68%)",
                  filter: "blur(5px)",
                }}
              />
              <p className="mt-3 text-center font-mono text-[10.5px] tracking-[0.22em] text-mut">
                {d.caption}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
