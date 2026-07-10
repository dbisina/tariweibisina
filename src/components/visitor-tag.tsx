"use client";

import { useEffect, useState } from "react";

interface Visitor {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
}

/**
 * Gimmick HUD tag (juba's coordinate-readout energy): fetches the visitor's
 * own IP + city client-side and prints it in the corner. Fails silently to
 * a neutral line if the lookup is blocked. Purely cosmetic — the value is
 * shown back to the same visitor, never stored here (analytics is task #9).
 */
export function VisitorTag({ className = "" }: { className?: string }) {
  const [v, setV] = useState<Visitor | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const ac = new AbortController();
    fetch("https://ipapi.co/json/", { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) =>
        setV({ ip: d.ip, city: d.city, region: d.region, country: d.country_name })
      )
      .catch(() => setFailed(true));
    return () => ac.abort();
  }, []);

  const place = v
    ? [v.city, v.region, v.country].filter(Boolean).join(", ")
    : failed
      ? "somewhere on earth"
      : "locating…";

  return (
    <div className={`font-mono text-[9.5px] leading-relaxed tracking-[0.14em] text-mut ${className}`}>
      <div className="flex items-center gap-1.5">
        <span className="h-1 w-1 rounded-full bg-acc" />
        <span>YOU ARE HERE</span>
      </div>
      <div className="mt-1 text-ink/70">{place.toUpperCase()}</div>
      <div className="mt-0.5">{v?.ip ?? (failed ? "IP HIDDEN" : "···")}</div>
    </div>
  );
}
