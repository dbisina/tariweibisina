"use client";

import { useStudioStore } from "@/lib/studio";
import { ResearchCard } from "./research-card";

export function ResearchList() {
  const research = useStudioStore((s) => s.config.research);
  return (
    <div className="mt-16 border-b border-ln">
      {research.map((entry, i) => (
        <ResearchCard key={entry.slug} entry={entry} index={i} />
      ))}
    </div>
  );
}
