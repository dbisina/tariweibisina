import { ALL_PROJECTS } from "@/lib/projects";
import type { ChatAction, ChatMessage, ChatProvider, ChatReply } from "./types";
import { OWNER } from "./knowledge";

/**
 * No-key fallback: keyword-routed responses so the assistant works out of
 * the box before a Gemini key is set. Deliberately simple and honest — it
 * never pretends to be the full model.
 */
export class LocalProvider implements ChatProvider {
  readonly name = "local" as const;

  async respond(messages: ChatMessage[]): Promise<ChatReply> {
    const last = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
    const q = last.toLowerCase();
    const has = (...t: string[]) => t.some((w) => q.includes(w));

    // project-specific
    const project = ALL_PROJECTS.find((p) => q.includes(p.name.toLowerCase()));
    if (project) {
      return reply(
        `${project.name} — ${project.blurb} It's tagged ${project.tag}. Want the full case page?`,
        [{ label: `Open ${project.name}`, path: `/projects/${project.slug}` }]
      );
    }

    if (has("hire", "quote", "cost", "price", "budget", "build for me", "work with")) {
      return reply(
        `Tell me what you want built and I'll get you a rough budget band — Daniel reviews and authorizes the real figure. Start on the Hire Me page.`,
        [{ label: "Get a quote", path: "/business/hire-me" }]
      );
    }
    if (has("project", "work", "built", "portfolio", "case", "shown")) {
      return reply(
        `Daniel has shipped ${ALL_PROJECTS.length} — systems like Relay, Aegis Matrix and ETLLM, plus client products like Hebron Hotels and StudyRAG. Browse them raw in the catalog, or read the full case studies.`,
        [
          { label: "Full catalog", path: "/catalog" },
          { label: "Case studies", path: "/business/projects" },
        ]
      );
    }
    if (has("engineer", "stack", "kernel", "gpu", "research", "hackathon", "code")) {
      return reply(
        `The engineering realm has the systems with schematics, research notes, and hackathons.`,
        [
          { label: "Projects", path: "/engineer/projects" },
          { label: "Research", path: "/engineer/research" },
          { label: "Hackathons", path: "/engineer/hackathons" },
        ]
      );
    }
    if (has("pitch", "invest", "vc", "raise")) {
      return reply(`The pitch decks are set up for investors — real numbers, a direct line.`, [
        { label: "Pitch decks", path: "/business/pitch-decks" },
      ]);
    }
    if (has("contact", "email", "reach", "linkedin", "github", "twitter", "whatsapp", "talk")) {
      return reply(
        `Fastest ways to reach Daniel: ${OWNER.email}, or GitHub / LinkedIn / X / WhatsApp on the contact page.`,
        [{ label: "Contact", path: "/contact" }]
      );
    }
    if (has("hobby", "hobbies", "f1", "formula", "football", "anime", "piano", "car", "music", "fun")) {
      return reply(`Off the clock: ${OWNER.hobbies}`);
    }
    if (has("who", "about", "you ", "yourself", "daniel", "tariwei", "rimuru")) {
      return reply(
        `I'm Rimuru, Daniel Tariwei Bisina's on-site guide. He's a ${OWNER.role.toLowerCase()} and founder of ${OWNER.company} — one engineer, the whole stack from GPU kernels to production apps. What do you want to see?`,
        [
          { label: "For engineers", path: "/engineer" },
          { label: "For business", path: "/business" },
        ]
      );
    }
    if (has("hi", "hey", "hello", "yo", "sup")) {
      return reply(
        `Hey — I'm Rimuru. I can walk you through Daniel's work, explain any project, or help you scope a build. Where to?`,
        [
          { label: "See the work", path: "/catalog" },
          { label: "Hire Daniel", path: "/business/hire-me" },
        ]
      );
    }

    return reply(
      `I can point you to the work, explain any project, take you to contact, or start a quote. Try "show me the projects", "who is Daniel", or "I want to hire him".`,
      [
        { label: "Projects", path: "/catalog" },
        { label: "Hire me", path: "/business/hire-me" },
        { label: "Contact", path: "/contact" },
      ]
    );
  }
}

function reply(text: string, actions?: ChatAction[]): ChatReply {
  return { text, actions, provider: "local" };
}
