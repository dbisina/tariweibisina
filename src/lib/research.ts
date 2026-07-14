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

export function researchBySlug(slug: string): ResearchEntry | undefined {
  return RESEARCH_ENTRIES.find((r) => r.slug === slug);
}
