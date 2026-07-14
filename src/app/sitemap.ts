import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { SEED_PROJECTS, SEED_PITCHES } from "@/lib/content";

type ChangeFreq = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: ChangeFreq }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/catalog", priority: 0.9, changeFrequency: "weekly" },
  { path: "/engineer", priority: 0.8, changeFrequency: "monthly" },
  { path: "/engineer/projects", priority: 0.8, changeFrequency: "monthly" },
  { path: "/engineer/research", priority: 0.6, changeFrequency: "monthly" },
  { path: "/engineer/hackathons", priority: 0.6, changeFrequency: "monthly" },
  { path: "/business", priority: 0.8, changeFrequency: "monthly" },
  { path: "/business/projects", priority: 0.8, changeFrequency: "monthly" },
  { path: "/business/pitch-decks", priority: 0.7, changeFrequency: "monthly" },
  { path: "/business/hire-me", priority: 0.9, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.7, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const projectEntries: MetadataRoute.Sitemap = SEED_PROJECTS.map((p) => ({
    url: `${SITE_URL}/projects/${p.slug}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const pitchEntries: MetadataRoute.Sitemap = SEED_PITCHES.map((p) => ({
    url: `${SITE_URL}/business/pitch-decks/${p.slug}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticEntries, ...projectEntries, ...pitchEntries];
}
