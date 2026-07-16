/**
 * Provider-agnostic chat layer. Gemini is the live default (VISION.md), but
 * the whole assistant talks to this interface, so swapping to Claude /
 * GPT / DeepSeek is one adapter file, not a rewrite.
 */

export type Role = "user" | "assistant" | "system";

export interface ChatMessage {
  role: Role;
  content: string;
}

/** An action the assistant surfaces to the visitor — rendered as a clickable
 * chip. This is how tool calls (navigate, open project, price a build)
 * become UI without coupling the model to the DOM. */
export interface ChatAction {
  label: string;
  /** internal route to push, if this action navigates */
  path?: string;
  /** external url to open */
  href?: string;
}

/** A project surfaced visually in the chat — rendered as a rich, clickable
 * card (hero image + name + tag) instead of a bare text link. Produced by
 * the show_project tool. */
export interface ProjectCard {
  slug: string;
  name: string;
  tag: string;
  image: string;
  oneLiner: string;
  path: string;
}

export interface ChatReply {
  text: string;
  actions?: ChatAction[];
  /** rich project cards to render above the reply text */
  cards?: ProjectCard[];
  /** which backend answered — surfaced in dev + telemetry */
  provider: "gemini" | "local";
}

export interface ChatProvider {
  readonly name: "gemini" | "local";
  respond(messages: ChatMessage[]): Promise<ChatReply>;
}
