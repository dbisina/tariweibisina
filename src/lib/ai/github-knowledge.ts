/**
 * Pulls real repo knowledge (README + file tree) for a project's `repoUrl`
 * so Rimuru can answer questions a one-line blurb can't — architecture,
 * stack, actual file layout. Fetched on-demand via the `get_project_details`
 * tool (gemini-provider.ts), not stuffed into every system prompt: 24
 * projects' worth of repo digests would blow the token budget on every
 * single chat turn for context most conversations never touch.
 *
 * Works unauthenticated (GitHub's public rate limit, 60 req/hr) and
 * gracefully degrades to null on any failure — a repo lookup failing never
 * breaks the chat, Rimuru just answers from the block content it already
 * has. Set GITHUB_TOKEN for the authenticated 5000 req/hr limit.
 */

const CACHE_TTL = 60 * 60 * 1000; // 1h — repo content doesn't change mid-conversation
const MAX_README_CHARS = 4000;
const MAX_TREE_ENTRIES = 150;

interface CachedDigest {
  text: string;
  fetchedAt: number;
}

const cache = new Map<string, CachedDigest>();

export function parseOwnerRepo(repoUrl: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(repoUrl);
    if (u.hostname !== "github.com") return null;
    const [owner, repo] = u.pathname.replace(/^\//, "").replace(/\.git$/, "").split("/");
    if (!owner || !repo) return null;
    return { owner, repo };
  } catch {
    return null;
  }
}

function ghHeaders(): HeadersInit {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
}

export async function ghJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, { headers: ghHeaders() });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Fetch a compact digest (description, language, README excerpt, file
 * tree) for a GitHub repo URL. Cached per-process; returns null for a
 * non-GitHub URL, a private/missing repo, or any fetch failure. */
export async function repoDigest(repoUrl: string): Promise<string | null> {
  const parsed = parseOwnerRepo(repoUrl);
  if (!parsed) return null;
  const key = `${parsed.owner}/${parsed.repo}`;

  const cached = cache.get(key);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) return cached.text;

  const meta = (await ghJson(`https://api.github.com/repos/${key}`)) as {
    description?: string | null;
    language?: string | null;
    default_branch?: string;
    topics?: string[];
  } | null;
  if (!meta) return cached?.text ?? null; // repo gone/private — serve stale if we have it, else nothing

  const [readmeData, treeData] = await Promise.all([
    ghJson(`https://api.github.com/repos/${key}/readme`) as Promise<{ content?: string } | null>,
    ghJson(
      `https://api.github.com/repos/${key}/git/trees/${meta.default_branch ?? "main"}?recursive=1`
    ) as Promise<{ tree?: { path: string; type: string }[] } | null>,
  ]);

  let readme = "";
  if (readmeData?.content) {
    try {
      readme = Buffer.from(readmeData.content, "base64").toString("utf-8").slice(0, MAX_README_CHARS);
    } catch {
      readme = "";
    }
  }

  const paths = (treeData?.tree ?? [])
    .filter((e) => e.type === "blob")
    .map((e) => e.path)
    .filter((p) => !/(^|\/)(node_modules|\.git|dist|build|\.next|out)\//.test(p))
    .slice(0, MAX_TREE_ENTRIES);

  const text = [
    `Repo: ${key}`,
    meta.description ? `Description: ${meta.description}` : null,
    meta.language ? `Primary language: ${meta.language}` : null,
    meta.topics?.length ? `Topics: ${meta.topics.join(", ")}` : null,
    paths.length ? `File tree (${paths.length}${paths.length === MAX_TREE_ENTRIES ? "+" : ""} files):\n${paths.join("\n")}` : null,
    readme ? `README:\n${readme}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  cache.set(key, { text, fetchedAt: Date.now() });
  return text;
}
