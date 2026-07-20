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

/** Google Search Console site-verification (HTML tag method). Set
 * NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION to the code GSC gives you when you
 * add the property — Settings → Ownership verification → HTML tag, just the
 * content="..." value, not the whole tag. Undefined until then, so no
 * broken empty verification tag ships in the meantime. */
export const GOOGLE_SITE_VERIFICATION = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined;

/** Sitewide <meta name="keywords"> list — name variants the visitor might
 * search plus the roles/skills/locations that describe the work. Kept as one
 * source so it's easy to review and edit in one place. */
export const SITE_KEYWORDS: string[] = [
  // name variants
  "Daniel",
  "Daniel Bisina",
  "Daniel Tariwei Bisina",
  "Daniel T. Bisina",
  "Tariwei",
  "Tariwei Bisina",
  "Bisina",
  "Bisina Daniel",
  "Bisina, Daniel",
  "Bisina, Daniel Tariwei",
  "D. Tariwei Bisina",
  "tariwei.com",
  "tariwei portfolio",
  "Daniel Bisina portfolio",
  "Daniel Bisina developer",
  "Daniel Bisina engineer",

  // core roles
  "software engineer",
  "software developer",
  "AI engineer",
  "AI systems engineer",
  "artificial intelligence engineer",
  "machine learning engineer",
  "ML engineer",
  "full stack developer",
  "full stack engineer",
  "fullstack software engineer",
  "backend developer",
  "backend engineer",
  "frontend developer",
  "frontend engineer",
  "web developer",
  "mobile app developer",
  "mobile developer",
  "app developer",
  "systems engineer",
  "platform engineer",
  "infrastructure engineer",
  "GPU engineer",
  "GPU kernel engineer",
  "LLM engineer",
  "LLM systems engineer",
  "AI agent developer",
  "AI agent engineer",
  "agent orchestration engineer",
  "product engineer",
  "solutions engineer",
  "technical co-founder",
  "startup engineer",
  "founder engineer",
  "indie hacker",
  "solo founder",
  "polyglot software engineer",
  "operating systems engineer",
  "distributed systems engineer",
  "cloud engineer",
  "DevOps engineer",
  "API developer",
  "database engineer",

  // location-based (Lagos / Nigeria / Africa)
  "software developer in Lagos",
  "software engineer in Lagos",
  "software engineer Lagos Nigeria",
  "Nigerian software engineer",
  "Nigerian software developer",
  "Lagos-based developer",
  "Lagos-based software engineer",
  "Lagos tech talent",
  "Nigeria AI engineer",
  "Nigerian AI engineer",
  "Nigerian app developer",
  "African software engineer",
  "West Africa software engineer",
  "remote software engineer Africa",
  "Nigeria software developer for hire",
  "Lagos app developer",
  "Lagos web developer",
  "Nigerian tech founder",
  "Nigeria machine learning engineer",
  "Africa AI engineer",
  "software developer in Nigeria",
  "software engineer in Nigeria",
  "software developer in Lekki",
  "software engineer in Lekki",
  "Lekki Lagos developer",
  "Lekki tech talent",
  "Lekki software company",
  "app developer Lekki",
  "web developer Lekki",
  "AI engineer Lekki",
  "AI engineer in Lagos",
  "AI engineer in Nigeria",
  "top software developer in Lagos",
  "top software engineer in Nigeria",
  "best software developer in Lagos",
  "best software engineer in Nigeria",
  "Lagos Nigeria software company",
  "Lagos software house",
  "software house Lagos",
  "software house Nigeria",
  "tech consultant Lagos",
  "tech consultant Nigeria",
  "technology consultant Lagos",

  // tech stack / skills
  "React developer",
  "React Native developer",
  "Next.js developer",
  "TypeScript engineer",
  "JavaScript developer",
  "Python developer",
  "Go developer",
  "Golang developer",
  "Rust developer",
  "CUDA developer",
  "PyTorch engineer",
  "Node.js developer",
  "PostgreSQL developer",
  "Postgres engineer",
  "AI infrastructure engineer",
  "LLM infrastructure engineer",
  "AI-native operating systems",
  "operating system for AI",
  "GPU kernels",
  "GPU scheduling",
  "multi-agent systems",
  "agentic AI developer",
  "RAG engineer",
  "retrieval augmented generation engineer",
  "prompt engineering",
  "vector database engineer",
  "cloud infrastructure engineer",
  "CI/CD engineer",
  "API design engineer",
  "e-commerce developer",
  "SaaS developer",
  "SaaS engineer",

  // hire / service intent
  "hire a software engineer",
  "hire a software developer",
  "hire an AI engineer",
  "hire a developer in Nigeria",
  "hire a developer in Lagos",
  "hire a full stack developer",
  "hire a mobile app developer",
  "custom software development Lagos",
  "custom software development Nigeria",
  "bespoke software Nigeria",
  "AI consultant Lagos",
  "AI consultant Nigeria",
  "freelance software developer",
  "freelance software engineer",
  "contract software engineer",
  "software development agency Lagos",
  "AI development agency Nigeria",
  "build an AI product",
  "build an MVP",
  "MVP developer",
  "startup technical partner",
  "app development Nigeria",
  "website developer Nigeria",
  "web app developer Lagos",
  "web app developer Lekki",
  "IT consultation",
  "IT consultation services",
  "IT consulting",
  "IT consulting Lagos",
  "IT consulting Nigeria",
  "technology consultation",
  "IT consultant",
  "IT person",
  "IT person in Lagos",
  "IT person in Nigeria",
  "hire an IT person",
  "need an IT person",
  "IT personnel Lagos",
  "IT support Lagos",
  "IT support Nigeria",
  "IT services Lagos",
  "IT services Nigeria",
  "IT company Lagos",

  // company / brand
  "DeusX Technologies",
  "DeusX",
  "DeusX founder",
  "DeusX Labs",
  "AI agent orchestration company",
  "AI-native OS company",

  // portfolio / project themes
  "software engineer portfolio",
  "software engineer portfolio Nigeria",
  "AI engineer portfolio",
  "engineering portfolio site",
  "developer portfolio Africa",
  "system design portfolio",
  "polyglot engineer",
  "GPU inference scheduling",
  "AI coding agent orchestrator",
  "agent handoff protocol",
  "LLM observability",
  "AI research engineer",
  "research engineer",
  "hackathon engineer",
  "hackathon winner software engineer",
  "technical founder Nigeria",
  "AI product engineer",
  "software architecture portfolio",
];

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

/** Real structured-data location signal — this is what Google actually reads
 * for "software engineer in Lagos/Lekki" relevance, not the keywords tag. */
const HOME_ADDRESS = {
  "@type": "PostalAddress",
  addressLocality: "Lekki",
  addressRegion: "Lagos",
  addressCountry: "NG",
};
const AREA_SERVED = ["Lagos", "Lekki", "Nigeria", "Africa", "Worldwide (remote)"];

export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE_URL}/#person`,
    name: OWNER.name,
    alternateName: [OWNER.brand, "Tariwei Bisina", "Bisina, Daniel Tariwei"],
    url: SITE_URL,
    jobTitle: OWNER.role,
    description: SITE_DESCRIPTION,
    email: `mailto:${OWNER.email}`,
    address: HOME_ADDRESS,
    homeLocation: { "@type": "Place", address: HOME_ADDRESS },
    workLocation: { "@type": "Place", address: HOME_ADDRESS },
    worksFor: { "@id": `${SITE_URL}/#organization` },
    sameAs: Object.values(OWNER.socials),
    knowsAbout: [
      "Software Engineering",
      "Artificial Intelligence",
      "Machine Learning",
      "GPU Kernel Programming",
      "AI-Native Operating Systems",
      "Large Language Models",
      "Full Stack Development",
      "Mobile App Development",
    ],
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: OWNER.company,
    url: SITE_URL,
    address: HOME_ADDRESS,
    areaServed: AREA_SERVED,
    founder: { "@id": `${SITE_URL}/#person` },
  };
}

/** Offer-the-work schema for the hire-me / quote page — a ProfessionalService
 * is the right type for "solo engineer takes freelance/contract briefs",
 * distinct from the Organization (DeusX) schema above. */
export function serviceJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${SITE_URL}/business/hire-me#service`,
    name: `${OWNER.name} — Software & AI Engineering Services`,
    provider: { "@id": `${SITE_URL}/#person` },
    areaServed: AREA_SERVED,
    address: HOME_ADDRESS,
    url: absoluteUrl("/business/hire-me"),
    description:
      "Custom software, full-stack web and mobile apps, and AI/LLM systems — scoped, built and shipped by one engineer.",
    serviceType: [
      "Custom software development",
      "AI and LLM system development",
      "Full stack web development",
      "Mobile app development",
      "IT consultation",
    ],
  };
}

/** A research note's detail page — TechArticle fits the "working notes on
 * engineering" content better than generic Article. */
export function articleJsonLd(entry: {
  slug: string;
  title: string;
  summary: string;
  image: string;
  publication: string;
}) {
  const yearMatch = entry.publication.match(/\d{4}/);
  const datePublished = yearMatch ? `${yearMatch[0]}-01-01` : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "@id": `${absoluteUrl(`/engineer/research/${entry.slug}`)}#article`,
    headline: entry.title,
    description: entry.summary,
    image: entry.image,
    url: absoluteUrl(`/engineer/research/${entry.slug}`),
    datePublished,
    author: { "@id": `${SITE_URL}/#person` },
    publisher: { "@id": `${SITE_URL}/#organization` },
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
