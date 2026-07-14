"use client";

import dynamic from "next/dynamic";

// three.js + @react-three/fiber only ever run in the browser (WebGL) and
// are the heaviest chunk on /catalog — `ssr: false` requires the dynamic()
// call itself to live in a Client Component, so this thin wrapper is the
// boundary (catalog/page.tsx is a Server Component).
const Catalog = dynamic(() => import("@/components/catalog").then((m) => m.Catalog), {
  ssr: false,
  loading: () => (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      <span className="font-mono text-[10px] tracking-[0.2em] text-mut">LOADING CATALOG…</span>
    </div>
  ),
});

export function CatalogLazy() {
  return <Catalog />;
}
