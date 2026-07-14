import { OWNER } from "@/lib/ai/knowledge";
import type { ProjectDoc } from "@/lib/content";

/**
 * Central SEO/SMO constants + JSON-LD builders. One source of truth so every
 * page's metadata and structured data agree with each other and with what
 * Rimuru tells visitors (lib/ai/knowledge.ts).
 *
 * Set NEXT_PUBLIC_SITE_URL in .env.local to the real deployed domain —
 * everything here (canonical URLs, OG/Twitter images, JSON-LD @id/url)
 * derives from it. Falls back to a placeholder so metadata is still valid
 * (just not canonically correct) before that's configured.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://tariwei.com").replace(/\/+$/, "");
export const SITE_NAME = "tariwei";
export const SITE_TITLE_DEFAULT = `${OWNER.name} — ${OWNER.role}`;
export const SITE_TITLE_TEMPLATE = `%s — ${OWNER.brand}`;
export const SITE_DESCRIPTION =
  `${OWNER.name} — ${OWNER.role.toLowerCase()} and founder of ${OWNER.company}. ` +
  `GPU kernels, AI-native operating systems, and production web & mobile — one engineer, the whole stack.`;
export const TWITTER_HANDLE = "@danielbisina";

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Render a JSON-LD payload as a script tag. Use once per page/layout. */
export function jsonLdScript(data: object) {
  return {
    __html: JSON.stringify(data),
  };
}

export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE_URL}/#person`,
    name: OWNER.name,
    alternateName: OWNER.brand,
    url: SITE_URL,
    jobTitle: OWNER.role,
    description: SITE_DESCRIPTION,
    email: `mailto:${OWNER.email}`,
    worksFor: { "@id": `${SITE_URL}/#organization` },
    sameAs: Object.values(OWNER.socials),
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: OWNER.company,
    url: SITE_URL,
    founder: { "@id": `${SITE_URL}/#person` },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    publisher: { "@id": `${SITE_URL}/#person` },
    inLanguage: "en",
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** A project/case-study page — CreativeWork covers both engineering systems
 * and client products without over-claiming (e.g. SoftwareApplication would
 * be wrong for a hospitality booking site). */
export function projectJsonLd(project: ProjectDoc) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `${absoluteUrl(`/projects/${project.slug}`)}#work`,
    name: project.name,
    headline: project.name,
    description: project.oneLiner,
    url: absoluteUrl(`/projects/${project.slug}`),
    image: project.image,
    keywords: project.tag,
    datePublished: /^\d{4}/.test(project.year) ? `${project.year.slice(0, 4)}-01-01` : undefined,
    creator: { "@id": `${SITE_URL}/#person` },
    about: project.side === "business" ? "Business software product" : "Engineering system",
  };
}
