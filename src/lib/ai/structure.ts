import { getProvider } from "./index";
import { heuristicBrief, type RawLead, type StructuredBrief } from "@/lib/leads";

/**
 * Turn a raw inquiry into a scoped StructuredBrief *before* it reaches Daniel
 * (VISION.md). Uses Gemini when GEMINI_API_KEY is set; otherwise the
 * deterministic heuristic keeps intake working with zero config. Any model /
 * parse failure degrades to the heuristic — structuring must never drop a lead.
 */

function extractJson(text: string): Record<string, unknown> | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

const asStrings = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean).slice(0, 8) : [];

export async function structureBrief(raw: RawLead): Promise<StructuredBrief> {
  const base = heuristicBrief(raw);
  if (!process.env.GEMINI_API_KEY) return base;

  const prompt =
    `You are Daniel's intake analyst. Convert this inquiry into STRICT JSON with keys: ` +
    `title (<=80 chars), summary (<=240 chars), projectType, budget, timeline, ` +
    `scope (array of concrete deliverables), risks (array of scoping risks/unknowns), ` +
    `priority ("low"|"medium"|"high"), suggestedReply (2 sentences, warm, first-person as Daniel). ` +
    `Return ONLY the JSON object, no prose.\n\n` +
    `source: ${raw.source}\nname: ${raw.name}\ncontact: ${raw.contact}\n` +
    `projectType: ${raw.projectType ?? "?"}\nbudget: ${raw.budget ?? "?"}\n` +
    `timeline: ${raw.timeline ?? "?"}\nbrief: """${raw.detail}"""`;

  try {
    const { text } = await getProvider("gemini").respond([{ role: "user", content: prompt }]);
    const j = extractJson(text);
    if (!j) return base;
    return {
      title: String(j.title ?? base.title).slice(0, 80),
      summary: String(j.summary ?? base.summary).slice(0, 240),
      projectType: String(j.projectType ?? base.projectType),
      budget: String(j.budget ?? base.budget),
      timeline: String(j.timeline ?? base.timeline),
      scope: asStrings(j.scope).length ? asStrings(j.scope) : base.scope,
      risks: asStrings(j.risks),
      priority:
        j.priority === "high" || j.priority === "medium" || j.priority === "low"
          ? j.priority
          : base.priority,
      suggestedReply: String(j.suggestedReply ?? base.suggestedReply),
    };
  } catch {
    return base;
  }
}
