"use client";

import { useStudioStore } from "@/lib/studio";
import type { ProjectDoc } from "@/lib/content";
import { PitchDeckViewer } from "@/components/pitch-deck-viewer";

/** Resolves the live Studio doc by slug (falling back to the server seed),
 * same pattern as ProjectDetail, then hands off to the full-screen deck. */
export function PitchDeckPage({ seed }: { seed: ProjectDoc }) {
  const live = useStudioStore((s) => s.config.projects.find((p) => p.slug === seed.slug));
  const doc = live ?? seed;
  if (!doc.pitch) return null;
  return <PitchDeckViewer doc={doc} />;
}
