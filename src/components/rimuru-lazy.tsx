"use client";

import dynamic from "next/dynamic";

// `ssr: false` requires the dynamic() call itself to live in a Client
// Component — layout.tsx is a Server Component, so this thin wrapper is
// the boundary. See rimuru.tsx for why it's deferred at all.
const Rimuru = dynamic(() => import("@/components/rimuru").then((m) => m.Rimuru), { ssr: false });

export function RimuruLazy() {
  return <Rimuru />;
}
