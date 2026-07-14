import { seedBySlug } from "@/lib/content";
import { getRepoIndexRow } from "@/lib/db";
import { projectDetails, projectSlugs } from "./knowledge";

/**
 * Shared tool contract for Rimuru — same declarations and same execution
 * logic whether the caller is the text chat's REST generateContent loop
 * (gemini-provider.ts) or a Live API WebSocket session (rimuru.tsx). Both
 * surfaces answer the same questions the same way; only the transport
 * differs.
 */
export const TOOLS = [
  {
    functionDeclarations: [
      {
        name: "get_project_details",
        description:
          "Full case-study content for one project, plus its GitHub README and file tree if a repo is linked. Call this before answering anything beyond a one-line summary — architecture, stack, how it works, specific claims. Never guess technical details.",
        parameters: {
          type: "object",
          properties: { slug: { type: "string", enum: projectSlugs() } },
          required: ["slug"],
        },
      },
      {
        name: "show_project",
        description:
          "Pull up a project's page for the visitor — a real navigation action, not just a description. Call this whenever they ask to see, open, pull up, or go to a specific project.",
        parameters: {
          type: "object",
          properties: { slug: { type: "string", enum: projectSlugs() } },
          required: ["slug"],
        },
      },
      {
        name: "get_repo_doc",
        description:
          "Read one doc from a project's indexed (graphified) repo knowledge pack — deep, LLM-written docs about the actual codebase: 'Architecture overview', 'Tech stack & dependencies', 'Module: <dir>' deep dives, plus the raw 'File tree', 'README' and 'Key files (verbatim)'. get_project_details lists which docs exist for a project. Use this for code-level questions the case study can't answer.",
        parameters: {
          type: "object",
          properties: {
            slug: { type: "string", enum: projectSlugs() },
            title: { type: "string", description: "Doc title, e.g. 'Architecture overview' or 'Module: src'" },
          },
          required: ["slug", "title"],
        },
      },
    ],
  },
];

export interface FunctionCall {
  name: string;
  args?: Record<string, unknown>;
}

export interface ToolExecResult {
  response: Record<string, unknown>;
  shownSlug?: string;
}

export async function executeTool(call: FunctionCall): Promise<ToolExecResult> {
  const slug = String(call.args?.slug ?? "");
  if (call.name === "get_project_details") {
    let details = await projectDetails(slug);
    // surface the graphified pack's doc index so the model knows what it
    // can pull next with get_repo_doc — and hand it the overview up front
    const index = await getRepoIndexRow(slug);
    if (index?.status === "ready" && index.docs.length) {
      const overview = index.docs.find((d) => d.title === "Architecture overview");
      details += `\n\n--- Indexed repo knowledge (read any with get_repo_doc) ---\nDocs: ${index.docs
        .map((d) => d.title)
        .join(" | ")}`;
      if (overview) details += `\n\n${overview.title}:\n${overview.content}`;
    }
    return { response: { details } };
  }
  if (call.name === "show_project") {
    const p = seedBySlug(slug);
    return {
      response: p ? { ok: true, path: `/projects/${slug}` } : { ok: false, error: "unknown slug" },
      shownSlug: p ? slug : undefined,
    };
  }
  if (call.name === "get_repo_doc") {
    const title = String(call.args?.title ?? "").trim().toLowerCase();
    const index = await getRepoIndexRow(slug);
    if (!index || index.status !== "ready" || !index.docs.length) {
      return { response: { error: "No indexed repo knowledge for this project — answer from the case study instead." } };
    }
    const doc =
      index.docs.find((d) => d.title.toLowerCase() === title) ??
      index.docs.find((d) => d.title.toLowerCase().includes(title) || title.includes(d.title.toLowerCase()));
    if (!doc) {
      return { response: { error: `No doc titled "${call.args?.title}". Available: ${index.docs.map((d) => d.title).join(" | ")}` } };
    }
    return { response: { title: doc.title, content: doc.content } };
  }
  return { response: { error: `unknown tool "${call.name}"` } };
}
