/**
 * Research entries — working notes behind the shipped systems. Each entry
 * backs one row on /engineer/research and its own internal detail page at
 * /engineer/research/[slug]. Never links out to an external reference —
 * every research card and its detail page are entirely on-site.
 */

export interface ResearchEntry {
  slug: string;
  title: string;
  publication: string; // e.g. "Working note · 2026"
  tag: string;
  summary: string;
  image: string;
  body: string[]; // detail-page paragraphs
}

export const RESEARCH_ENTRIES: ResearchEntry[] = [
  {
    slug: "gpu-scheduling",
    title: "Scheduling LLM inference across consumer GPUs",
    publication: "Working note · 2026",
    tag: "GPU · RUNTIME",
    summary:
      "The bottleneck isn't compute. It's what you choose to run, and when — a scheduler that picks the right backend per operation beats brute-force parallelism on hardware that was never meant to share a workload.",
    image: "https://picsum.photos/seed/tariwei-uhop/1024/704",
    body: [
      "Consumer GPUs weren't built to share inference workloads the way a datacenter cluster is. The obvious move — throw more parallelism at the problem — runs into memory bandwidth and thermal limits fast.",
      "The more useful lever turned out to be scheduling: detecting which backend (CUDA, ROCm, Metal, OpenCL, CPU fallback) actually wins for a given operation on the machine in front of you, and caching that choice instead of re-deciding every call.",
      "Where this got interesting: the fastest backend for a matmul isn't always the fastest backend for a conv2d on the same card, and that gap widens on older or thermally-throttled hardware. A one-size-fits-all dispatch loses real throughput.",
      "Open question: how much of this generalizes past matrix ops — attention kernels, quantized inference — before the per-operation cache stops paying for itself.",
    ],
  },
  {
    slug: "agent-handoff-protocols",
    title: "Protocols for handing work between agents under partial context",
    publication: "Draft · 2026",
    tag: "AGENTS · SYSTEMS",
    summary:
      "Most handoffs lose state. The interesting part is what survives — plan, constraints, and in-flight edits carry across a handoff far more reliably than raw conversation history does.",
    image: "https://picsum.photos/seed/tariwei-relay/1024/704",
    body: [
      "An agent that runs out of context, quota, or patience mid-task has to hand its work to a fresh agent that knows nothing about what came before. The naive fix — dump the whole transcript — is expensive and still loses the thread.",
      "A signed continuation contract (intent, plan, remaining tasks, in-flight code, decisions and constraints) turned out to compress the handoff to what actually matters, and it survives crossing between different model providers, not just a fresh session of the same one.",
      "The harder part isn't the schema — it's timing. A handoff triggered after the agent has already stalled is a recovery. A handoff triggered from a forecast of remaining capacity, before the wall arrives, is a relay. The latter reads completely differently to whoever's waiting on the output.",
      "Still open: how to represent partial trust — when the incoming agent should verify a claim in the contract rather than take it at face value.",
    ],
  },
  {
    slug: "ai-native-os-primitives",
    title: "Treating models as processes in an AI-native operating system",
    publication: "Notes · 2026",
    tag: "OPERATING SYSTEMS",
    summary:
      "If a model can be scheduled, it can be a citizen of the kernel, not a guest of it — the OS primitives that manage processes (priority, preemption, resource limits) apply almost directly to managing models.",
    image: "https://picsum.photos/seed/tariwei-rimuru-os/1024/704",
    body: [
      "Every AI assistant today runs as an application sitting on top of a conventional OS — it asks for resources the same way a browser tab does, and the OS has no concept of what it's actually running.",
      "Reframing a model as a schedulable unit — with its own priority, memory ceiling, and preemption rules — starts to look less like a metaphor and more like a straightforward port of process-management primitives that already exist.",
      "The payoff shows up at the interaction layer: instead of opening an app and finding the right button, the system takes a spoken or typed intent and routes it to whichever process (model or otherwise) can act on it, the way a shell routes a command to a binary.",
      "Unresolved: security boundaries. A process with filesystem access is a known, fenced risk. A model with the same access, reasoning about what to touch, is a different shape of problem entirely.",
    ],
  },
];

const MORE_ENTRIES: ResearchEntry[] = [
  {
    slug: "llm-observability-zscores",
    title: "Statistical anomaly detection beats LLM-judged evals for production monitoring",
    publication: "Working note · 2025",
    tag: "OBSERVABILITY · MLOPS",
    summary:
      "Everyone reaches for an LLM to judge LLM outputs. For catching production regressions, a rolling Z-score over sixteen cheap numeric signals caught more real incidents, faster, for a fraction of the cost.",
    image: "https://picsum.photos/seed/tariwei-sentinel-llm-observability/1024/704",
    body: [
      "Sentinel started with the fashionable design: sample production traffic, have a judge model grade responses, alert on grade drops. It worked in the demo and fell apart in production — judge costs scaled with traffic, judgments drifted with the judge's own model updates, and the latency between an incident starting and enough graded samples accumulating was measured in hours.",
      "The replacement is embarrassingly classical: sixteen numeric signals per request (latency percentiles, token counts, refusal-phrase hits, format-validity checks, embedding drift against a golden set) with rolling Z-scores per signal. An incident is a sustained excursion across correlated signals, not one bad sample.",
      "The interesting part is what each approach catches. The judge was better at subtle quality decay — answers that got blander. The Z-scores were better at everything that actually pages someone: silent truncations after a provider update, a prompt-injection wave shifting refusal rates, a tokenizer change inflating costs 3x overnight.",
      "The hybrid that shipped: statistics decide WHEN something is wrong (cheap, fast, deterministic), and a judge model runs a diagnostic pass on the anomalous window to describe WHAT went wrong — Gemini writes the root-cause narrative that lands in the Datadog incident.",
      "Open question: golden-set maintenance. Embedding drift against a fixed reference set slowly goes stale as legitimate usage evolves; refreshing the reference set without laundering real regressions into the new baseline is an unsolved chore.",
    ],
  },
  {
    slug: "block-cms-single-editor",
    title: "A block-based CMS is the right shape even when the only editor is you",
    publication: "Notes · 2026",
    tag: "SYSTEMS · CMS",
    summary:
      "Four client CMSes and one portfolio later: uniform blocks with dumb fields beat clever schemas every time someone (including future-you) has to actually edit content.",
    image: "https://picsum.photos/seed/tariwei-uto-cms/1024/704",
    body: [
      "I've now built content systems for a hotel, a nonprofit, a fashion storefront, a geospatial consultancy, and my own portfolio. The versions that survived contact with real editors share one property: content is an ordered list of typed blocks with a single uniform field shape, and the renderer decides what each type means.",
      "The tempting alternative — a discriminated union where each block type has exactly its own fields — produces better TypeScript and worse software. Every new block type touches the schema, the editor, the store migrations, and the renderer. With a uniform shape, a new type is a renderer case and an editor label map; the store never changes.",
      "Unused fields sitting empty on every block feel wasteful until you notice what they buy: the editor is one generic component, JSON round-trips through any storage without adapters, and half-written content never fails validation while someone is mid-edit.",
      "The same argument holds for the hybrid storage layout — flexible JSON blobs for page chrome (nav, theme, hero copy) alongside real relational rows for things that need querying (bookings, leads, inventory). The mistake is picking one religion; the win is knowing which data is which.",
      "Where blocks genuinely struggle: cross-block constraints. 'The stats block must match the hero numbers' is invisible to a per-block editor. So far the honest answer is: don't encode it, let the human read the page.",
    ],
  },
  {
    slug: "realtime-voice-tool-calling",
    title: "Tool-calling over a voice WebSocket: keeping one contract for text and speech",
    publication: "Working note · 2026",
    tag: "AGENTS · VOICE",
    summary:
      "A voice agent that can act — pull up pages, fetch real data mid-sentence — needs its tools to live somewhere both the REST chat loop and the audio WebSocket can execute them. The seam is the tool contract, not the transport.",
    image: "https://picsum.photos/seed/tariwei-rimuru-live/1024/704",
    body: [
      "Adding real-time voice to an existing text assistant looks like an audio problem (PCM formats, sample rates, interruption handling). The harder design problem turned out to be architectural: the text loop executes tools server-side inside one HTTP request, while the voice session is a WebSocket that terminates in the browser — which can't run server-only code like database reads or GitHub fetches.",
      "The shape that worked: one shared tool module (declarations + an executeTool function) used three ways. The REST chat loop calls it in-process. The voice client receives toolCall frames over the WebSocket and proxies them to a thin API route that calls the same executeTool. And the ephemeral session token bakes the same declarations into its constraints, so a leaked token can't be repurposed into a general assistant.",
      "Ephemeral tokens matter more for voice than text: the browser must connect directly to the model provider for latency, so it must hold a credential. Locking model, system prompt and tool list into the token at mint time means the credential is only good for being Rimuru, briefly.",
      "Interruption handling is where audio does get interesting: when the user talks over the model, the server sends an interrupted flag, and the client has to discard its queued playback buffer immediately — an audio cursor reset, or the model audibly finishes a sentence the user already cut off.",
      "Unresolved: transcript identity. The input transcription stream and the output transcription stream arrive as separate fragments with no turn ids, so stitching a clean conversation log out of a barge-in-heavy session is still heuristic.",
    ],
  },
  {
    slug: "repo-knowledge-without-vectors",
    title: "Deep repo knowledge for an on-site agent — without a vector database",
    publication: "Draft · 2026",
    tag: "AGENTS · RETRIEVAL",
    summary:
      "For two dozen repos, pre-written docs beat embeddings: index once into a handful of LLM-authored documents (architecture, stack, per-module dives), then let the agent read titles and fetch whole docs on demand.",
    image: "https://picsum.photos/seed/tariwei-graphify/1024/704",
    body: [
      "The default answer to 'make the assistant know my code' is RAG: chunk the repo, embed the chunks, retrieve top-k at question time. For a portfolio assistant covering ~24 repos, that stack is mostly overhead — embedding infra, chunk-boundary artifacts, and retrieved fragments that lack the context to answer architectural questions anyway.",
      "The alternative that shipped: at index time, an LLM reads the repo's README, manifests, file tree and sampled sources, and writes a small set of named documents — an architecture overview, a tech-stack digest, and a deep-dive per major module. The agent's retrieval tool is then just get_doc(title): it sees the table of contents and requests whole documents.",
      "This inverts where the intelligence sits. RAG puts it at query time (find relevant fragments); this puts it at index time (write coherent documents once). For codebases, coherence wins: 'how does the scheduler work' is answered by a document about the scheduler, not by seven 400-token fragments that mention it.",
      "The failure mode is staleness — docs describe the repo as of indexing. For a portfolio that's fine (projects are milestones, not moving targets); for active development it would need re-index triggers on push. The other cost is honesty: the indexing prompt has to demand evidence-based writing, because a summarizing LLM will otherwise happily describe the architecture the README promises rather than the one the file tree shows.",
      "Where this stops scaling: hundreds of repos or monorepos too large to sample meaningfully. At that point chunked retrieval earns its complexity back — but the doc layer is still worth keeping as the first hop.",
    ],
  },
];

RESEARCH_ENTRIES.push(...MORE_ENTRIES);

export function researchBySlug(slug: string): ResearchEntry | undefined {
  return RESEARCH_ENTRIES.find((r) => r.slug === slug);
}
