"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useStudioStore } from "@/lib/studio";
import type { ChatAction } from "@/lib/ai/types";

/**
 * Rimuru — the on-site slime. He is ALIVE on every page: full ragdoll
 * physics (gravity, squash & stretch, momentum), draggable and throwable,
 * lands on anything tagged `data-perch`, reacts to hover/scroll/poke, sleeps
 * when idle, and teleports through a little portal on page navigation.
 * Tapping him (or the docked bar) opens the ambient, non-blocking AI chat
 * that lives at the bottom of the screen — never a modal. "Go Live" opens a
 * voice+camera call: mic in via SpeechRecognition, voice out via
 * speechSynthesis, self-camera preview shown.
 */

interface Msg {
  role: "user" | "assistant";
  text: string;
  actions?: ChatAction[];
}

// browser speech-recognition surface we actually touch
type SpeechRec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: (e: { results: ArrayLike<{ isFinal: boolean } & ArrayLike<{ transcript: string }>> }) => void;
  onerror: () => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
};

const GREETING: Msg = {
  role: "assistant",
  text: "Hey — I'm Rimuru, Daniel's on-site guide. Ask about any project, the systems behind it, or scoping a build.",
  actions: [
    { label: "See the work", path: "/catalog" },
    { label: "Hire Daniel", path: "/business/hire-me" },
  ],
};

function commentsFor(path: string): string[] {
  if (/\/projects\/[^/]+$|\/pitch-decks\/[^/]+$/.test(path))
    return [
      "Scroll to the architecture bit — Daniel sweats the system design.",
      "This one shipped to real users. Want the impact numbers?",
      "Curious how it was built? Tap me and ask.",
    ];
  if (path.includes("projects") || path === "/catalog")
    return [
      "The whole catalog — engineering and business both. Poke around.",
      "See one you like? I'll tell you the story behind it.",
    ];
  if (path.includes("hire-me"))
    return [
      "Scoping a build? Tell me the goal — I'll shape a proper brief for Daniel.",
      "Budget, timeline, outcome — I structure it before it reaches him.",
    ];
  if (path.includes("contact"))
    return ["Want me to pass a note to Daniel? I can do that."];
  return [
    "Psst — I'm Rimuru. Tap me anytime.",
    "Lost? I know every corner of this place.",
    "Want the highlight reel? Just ask.",
  ];
}

// ── ambient line pools (physics-triggered, not page-triggered) ───────────
const MUSES = [
  "Still here, still watching the pixels move.",
  "Everything on this page is real work — no filler.",
  "Scroll speed says you're a scanner, not a reader. Respect.",
  "Ask me anything — I know where all the good stuff is.",
];
const POKE_LINES = ["Hey!", "That tickles.", "Okay, okay — I'm listening."];
const POKE_ANNOYED = "Alright, alright — poke me less, chat with me more.";
const SLEEP_WAKE_LINE = "Oh — hey, welcome back.";
const SCROLL_LINE = "Whoa, slow down — or don't, I'm keeping up.";
const BOTTOM_LINE = "End of the page. That's everything — for now.";
const PARK_LINE = "Standing by over here if you need me.";
const UNPARK_LINE = "Back on patrol.";
const FIRST_LAND_LINE = "Hey — I'm Rimuru. Drag me, poke me, or tap to chat.";

function perchLine(label: string): string {
  const pool = [
    `${label}? Good call.`,
    `Landed on ${label}. Comfy up here.`,
    `${label} — noted.`,
  ];
  return pool[Math.floor(Math.random() * pool.length)];
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── PCM16 <-> base64 helpers for the Gemini Live API's raw audio frames ──
// (16-bit signed little-endian PCM; 16kHz mic input, 24kHz model output —
// https://ai.google.dev/gemini-api/docs/live-api/get-started-websocket)
function floatTo16BitPCM(input: Float32Array): Int16Array {
  const out = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

function downsampleTo16k(input: Float32Array, inputRate: number): Float32Array {
  if (inputRate === 16000) return input;
  const ratio = inputRate / 16000;
  const outLength = Math.floor(input.length / ratio);
  const out = new Float32Array(outLength);
  for (let i = 0; i < outLength; i++) out[i] = input[Math.floor(i * ratio)];
  return out;
}

function base64FromInt16(i16: Int16Array): string {
  const bytes = new Uint8Array(i16.buffer, i16.byteOffset, i16.byteLength);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function int16FromBase64(b64: string): Int16Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Int16Array(bytes.buffer);
}

/** friendly label for a landed/hovered element: its explicit data-perch tag,
 * or a trimmed snippet of its own text — so he can perch on (and talk about)
 * anything with real content, not just the elements we hand-tagged. */
function perchLabel(el: Element): string {
  const explicit = el.getAttribute("data-perch");
  if (explicit) return explicit;
  const text = (el.textContent || "").trim().replace(/\s+/g, " ");
  if (!text) return "this thing";
  return text.length > 28 ? `${text.slice(0, 26)}…` : text;
}

type Checkable = HTMLElement & {
  checkVisibility?: (opts?: { opacityProperty?: boolean; visibilityProperty?: boolean }) => boolean;
};

/** is this a real, visible, non-decorative bit of content worth landing on?
 * excludes anything inside a `data-no-perch` zone (Rimuru's own UI, purely
 * background/watermark elements), hidden or near-invisible elements, and
 * anything too small to read as a platform. */
function isPerchable(el: HTMLElement): boolean {
  if (el.closest("[data-no-perch]")) return false;
  if (el.getAttribute("aria-hidden") === "true") return false;
  const checkable = el as Checkable;
  if (typeof checkable.checkVisibility === "function" &&
    !checkable.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return false;
  if (!(el.textContent || "").trim()) return false;
  const r = el.getBoundingClientRect();
  if (r.width < 56 || r.height < 14) return false;
  if (parseFloat(window.getComputedStyle(el).opacity) < 0.4) return false;
  return true;
}

// ── physics tuning ─────────────────────────────────────────────────────
type Expr = "content" | "happy" | "scrunched" | "surprised" | "sleepy" | "thinking";
const SIZE = 76;
const H = 57;
const G = 2400;
const REST = 0.55;
const FLOOR_MARGIN = 26;
const COOLDOWN = 7000;

interface Phys {
  x: number;
  by: number;
  vx: number;
  vy: number;
  support: "floor" | HTMLElement | null;
  grounded: boolean;
  thrown: boolean;
  bouncesLeft: number;
  traveling: boolean;
  travelX: number;
  hopsLeft: number;
  onArrive: (() => void) | null;
  facingT: number;
  facingC: number;
  s: number;
  ss: number;
  parkedF: number;
  dragging: boolean;
  dragMoved: boolean;
  dragDX: number;
  dragDY: number;
  dragStart: { x: number; y: number; t: number } | null;
  samples: { t: number; x: number; by: number }[];
  sleeping: boolean;
  aiThinking: boolean;
  trExpr: Expr | null;
  trUntil: number;
  curExpr: Expr | null;
  lastActivity: number;
  lastSay: number;
  lastScrollNote: number;
  lastBottomNote: number;
  lastHintAt: number;
  perchSaidAt: Map<Element, number>;
  hoverEl: Element | null;
  scrollPrev: number;
  scrollPrevT: number;
  scrollEMA: number;
  firstLand: boolean;
  teleporting: boolean;
  vw: number;
  vh: number;
  perches: HTMLElement[];
  pokeTimes: number[];
  timers: Set<ReturnType<typeof setTimeout>>;
  raf: number;
  lastT: number;
}

interface Engine {
  onRouteChange: (pathname: string) => void;
  hideBubble: () => void;
  dock: () => void;
  undock: () => void;
  startThinkingFX: () => void;
  stopThinkingFX: () => void;
  destroy: () => void;
}

export function Rimuru() {
  const router = useRouter();
  const pathname = usePathname();
  const aiPref = useStudioStore((s) => s.config.ai.provider);

  const [open, setOpen] = useState(false); // ambient chat expanded
  const [live, setLive] = useState(false); // voice/camera call
  const [parked, setParked] = useState(false); // manual standby toggle
  const [parkHint, setParkHint] = useState(false); // periodic "click to park" callout
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [liveMuted, setLiveMuted] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([GREETING]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<SpeechRec | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ── Gemini Live API (real-time voice call) ────────────────────────
  const liveWsRef = useRef<WebSocket | null>(null);
  const liveAudioCtxRef = useRef<AudioContext | null>(null);
  const livePlayCursorRef = useRef(0); // AudioContext.currentTime cursor for gapless queued playback
  const liveMutedRef = useRef(false);
  const liveMicNodesRef = useRef<{
    source: MediaStreamAudioSourceNode;
    processor: ScriptProcessorNode;
    silentGain: GainNode;
  } | null>(null);
  const liveInBufferRef = useRef(""); // accumulating input transcript for the current user turn
  const liveOutBufferRef = useRef(""); // accumulating output transcript for the current model turn
  const liveActiveRoleRef = useRef<"user" | "assistant" | null>(null); // which msg bubble is still being appended to

  // ── physics DOM refs ─────────────────────────────────────────────
  const slimeRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const bubbleTextRef = useRef<HTMLDivElement>(null);
  const tailRef = useRef<HTMLSpanElement>(null);
  const bangRef = useRef<HTMLDivElement>(null);
  const zzzRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);
  const faceRef = useRef<SVGGElement>(null);
  const fContent = useRef<SVGGElement>(null);
  const fHappy = useRef<SVGGElement>(null);
  const fScrunch = useRef<SVGGElement>(null);
  const fSurprised = useRef<SVGGElement>(null);
  const fSleepy = useRef<SVGGElement>(null);
  const fThinking = useRef<SVGGElement>(null);

  const engineRef = useRef<Engine | null>(null);
  const firstPathRef = useRef(true);

  // reactive flags mirrored into refs so the physics engine (set up once)
  // always reads the current value without needing to be recreated
  const openRef = useRef(open);
  const liveRef = useRef(live);
  const parkedRef = useRef(parked);
  const busyRef = useRef(busy);
  const routerRef = useRef(router);
  useEffect(() => { openRef.current = open; }, [open]);
  useEffect(() => { liveRef.current = live; }, [live]);
  useEffect(() => { parkedRef.current = parked; }, [parked]);
  useEffect(() => { busyRef.current = busy; }, [busy]);
  useEffect(() => { routerRef.current = router; }, [router]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, open]);

  // ── chat ─────────────────────────────────────────────────────────
  const send = useCallback(
    async (text: string) => {
      const q = text.trim();
      if (!q || busy) return;
      setInput("");
      engineRef.current?.hideBubble();
      setMsgs((m) => [...m, { role: "user", text: q }]);
      setBusy(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: q, provider: aiPref }),
        });
        const data = await res.json();
        setMsgs((m) => [...m, { role: "assistant", text: data.text, actions: data.actions }]);
      } catch {
        setMsgs((m) => [
          ...m,
          { role: "assistant", text: "Connection hiccup — try that again in a moment." },
        ]);
      } finally {
        setBusy(false);
      }
    },
    [aiPref, busy]
  );

  const openChat = useCallback(() => {
    engineRef.current?.hideBubble();
    setOpen(true);
  }, []);

  // ── speech recognition — dictate-to-text for the docked mic button
  // only now; the live call (below) streams raw audio to the Gemini Live
  // API directly instead of going through this browser API + text chat. ──
  const makeRec = useCallback((): SpeechRec | null => {
    const W = window as unknown as {
      webkitSpeechRecognition?: new () => SpeechRec;
      SpeechRecognition?: new () => SpeechRec;
    };
    const Ctor = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!Ctor) return null;
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const r = e.results[e.results.length - 1];
      if (!r || !r.isFinal) return;
      const t = r[0]?.transcript ?? "";
      if (t.trim()) send(t);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    return rec;
  }, [send]);

  const toggleMic = () => {
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = makeRec();
    if (!rec) return;
    recRef.current = rec;
    setListening(true);
    setOpen(true);
    rec.start();
  };

  // ── live call — real Gemini Live API over WebSocket ───────────────
  // https://ai.google.dev/gemini-api/docs/live-api/get-started-websocket
  // The browser connects DIRECTLY to Google using a short-lived token
  // minted server-side (api/live-token) so the real API key never reaches
  // the client. Camera is a local self-preview only — not streamed to the
  // model (this is a voice call, not video understanding).
  const upsertLiveMsg = useCallback((role: "user" | "assistant", text: string) => {
    setMsgs((m) => {
      if (liveActiveRoleRef.current === role && m.length && m[m.length - 1].role === role) {
        return [...m.slice(0, -1), { role, text }];
      }
      liveActiveRoleRef.current = role;
      return [...m, { role, text }];
    });
  }, []);

  const playLiveAudio = useCallback((i16: Int16Array, sampleRate: number) => {
    const ctx = liveAudioCtxRef.current;
    if (!ctx) return;
    const f32 = new Float32Array(i16.length);
    for (let i = 0; i < i16.length; i++) f32[i] = i16[i] / 0x8000;
    const buf = ctx.createBuffer(1, f32.length, sampleRate);
    buf.copyToChannel(f32, 0);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    const startAt = Math.max(ctx.currentTime, livePlayCursorRef.current);
    src.start(startAt);
    livePlayCursorRef.current = startAt + buf.duration;
  }, []);

  const startLiveMicCapture = useCallback((ctx: AudioContext, stream: MediaStream) => {
    const audioTracks = stream.getAudioTracks();
    if (!audioTracks.length) return;
    const source = ctx.createMediaStreamSource(new MediaStream(audioTracks));
    // ScriptProcessorNode is deprecated but universally supported and far
    // simpler than an AudioWorklet module for this — fine for a voice call.
    const processor = ctx.createScriptProcessor(4096, 1, 1);
    const silentGain = ctx.createGain();
    silentGain.gain.value = 0; // must be wired to a destination to tick, but must not be audible (echo)
    source.connect(processor);
    processor.connect(silentGain);
    silentGain.connect(ctx.destination);
    processor.onaudioprocess = (e) => {
      if (liveMutedRef.current) return;
      const ws = liveWsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      const down = downsampleTo16k(e.inputBuffer.getChannelData(0), ctx.sampleRate);
      const b64 = base64FromInt16(floatTo16BitPCM(down));
      ws.send(JSON.stringify({ realtimeInput: { audio: { data: b64, mimeType: "audio/pcm;rate=16000" } } }));
    };
    liveMicNodesRef.current = { source, processor, silentGain };
  }, []);

  const startLive = async () => {
    setOpen(false);
    setLive(true);
    liveInBufferRef.current = "";
    liveOutBufferRef.current = "";
    liveActiveRoleRef.current = null;
    liveMutedRef.current = false;
    setLiveMuted(false);

    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      /* no camera/mic permission — surfaces as a connect failure below since there's no audio to send */
    }

    let token: string;
    try {
      const res = await fetch("/api/live-token", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.token) throw new Error(data.error || "no token");
      token = data.token;
    } catch {
      setMsgs((m) => [...m, { role: "assistant", text: "Couldn't start the live call — try again in a moment." }]);
      setLive(false);
      return;
    }

    const audioCtx = new AudioContext();
    liveAudioCtxRef.current = audioCtx;
    livePlayCursorRef.current = 0;

    const ws = new WebSocket(
      `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?access_token=${encodeURIComponent(token)}`
    );
    liveWsRef.current = ws;

    ws.onopen = () => {
      // config (model, tools, system instruction, transcription) is already
      // locked into the token via liveConnectConstraints — this just starts
      // the session.
      ws.send(JSON.stringify({ setup: { model: "models/gemini-3.1-flash-live-preview" } }));
    };

    ws.onmessage = async (ev) => {
      const raw = typeof ev.data === "string" ? ev.data : await (ev.data as Blob).text();
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(raw);
      } catch {
        return;
      }

      if (msg.setupComplete) {
        if (stream) startLiveMicCapture(audioCtx, stream);
        setListening(true);
        return;
      }

      const sc = msg.serverContent as
        | {
            interrupted?: boolean;
            turnComplete?: boolean;
            modelTurn?: { parts?: { inlineData?: { data?: string; mimeType?: string } }[] };
            inputTranscription?: { text?: string };
            outputTranscription?: { text?: string };
          }
        | undefined;
      if (sc) {
        if (sc.interrupted) livePlayCursorRef.current = audioCtx.currentTime; // drop queued playback, the model was cut off
        for (const part of sc.modelTurn?.parts ?? []) {
          if (part.inlineData?.data) playLiveAudio(int16FromBase64(part.inlineData.data), 24000);
        }
        if (sc.inputTranscription?.text) {
          liveInBufferRef.current += sc.inputTranscription.text;
          upsertLiveMsg("user", liveInBufferRef.current);
        }
        if (sc.outputTranscription?.text) {
          liveOutBufferRef.current += sc.outputTranscription.text;
          upsertLiveMsg("assistant", liveOutBufferRef.current);
        }
        if (sc.turnComplete) {
          liveInBufferRef.current = "";
          liveOutBufferRef.current = "";
          liveActiveRoleRef.current = null;
        }
      }

      const toolCall = msg.toolCall as { functionCalls?: { id: string; name: string; args?: Record<string, unknown> }[] } | undefined;
      if (toolCall?.functionCalls?.length) {
        const responses = await Promise.all(
          toolCall.functionCalls.map(async (call) => {
            try {
              const res = await fetch("/api/tool-exec", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: call.name, args: call.args ?? {} }),
              });
              const result = await res.json();
              if (call.name === "show_project" && result.response?.path) router.push(result.response.path);
              return { id: call.id, name: call.name, response: result.response ?? { error: "tool failed" } };
            } catch {
              return { id: call.id, name: call.name, response: { error: "tool failed" } };
            }
          })
        );
        ws.send(JSON.stringify({ toolResponse: { functionResponses: responses } }));
      }
    };

    ws.onerror = () => {
      setMsgs((m) => [...m, { role: "assistant", text: "Live connection hiccup — try ending and starting the call again." }]);
    };
    ws.onclose = () => setListening(false);
  };

  const endLive = useCallback(() => {
    setListening(false);
    liveWsRef.current?.close();
    liveWsRef.current = null;
    const nodes = liveMicNodesRef.current;
    if (nodes) {
      nodes.processor.disconnect();
      nodes.source.disconnect();
      nodes.silentGain.disconnect();
      liveMicNodesRef.current = null;
    }
    liveAudioCtxRef.current?.close().catch(() => {});
    liveAudioCtxRef.current = null;
    liveActiveRoleRef.current = null;
    liveInBufferRef.current = "";
    liveOutBufferRef.current = "";
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLive(false);
  }, []);

  const toggleLiveMute = () => {
    setLiveMuted((v) => {
      liveMutedRef.current = !v;
      return !v;
    });
  };

  useEffect(() => () => endLive(), [endLive]);

  const doAction = (a: ChatAction) => {
    if (a.path) {
      setOpen(false);
      router.push(a.path);
    } else if (a.href) window.open(a.href, "_blank", "noopener");
  };

  // ── keyboard shortcut events (K / Space / Escape, dispatched by KeyboardShortcuts) ─
  useEffect(() => {
    const onToggle = () => {
      engineRef.current?.hideBubble();
      setOpen((o) => !o);
    };
    const onClose = () => {
      setOpen(false);
      engineRef.current?.hideBubble();
    };
    window.addEventListener("rimuru:toggle", onToggle);
    window.addEventListener("rimuru:close", onClose);
    return () => {
      window.removeEventListener("rimuru:toggle", onToggle);
      window.removeEventListener("rimuru:close", onClose);
    };
  }, []);

  // ── the physics engine — set up once real DOM nodes exist ────────
  useEffect(() => {
    const slimeEl = slimeRef.current;
    const bodyEl = bodyRef.current;
    if (!slimeEl || !bodyEl) return;

    const phys: Phys = {
      x: window.innerWidth * 0.72,
      by: window.innerHeight * 0.22,
      vx: 0,
      vy: 0,
      support: null,
      grounded: false,
      thrown: false,
      bouncesLeft: 0,
      traveling: false,
      travelX: 0,
      hopsLeft: 0,
      onArrive: null,
      facingT: 1,
      facingC: 1,
      s: 1,
      ss: 0,
      parkedF: 0,
      dragging: false,
      dragMoved: false,
      dragDX: 0,
      dragDY: 0,
      dragStart: null,
      samples: [],
      sleeping: false,
      aiThinking: false,
      trExpr: null,
      trUntil: 0,
      curExpr: null,
      lastActivity: Date.now(),
      lastSay: 0,
      lastScrollNote: 0,
      lastBottomNote: 0,
      lastHintAt: 0,
      perchSaidAt: new Map(),
      hoverEl: null,
      scrollPrev: 0,
      scrollPrevT: 0,
      scrollEMA: 0,
      firstLand: true,
      teleporting: false,
      vw: window.innerWidth,
      vh: window.innerHeight,
      perches: [],
      pokeTimes: [],
      timers: new Set(),
      raf: 0,
      lastT: 0,
    };

    const floorY = () => phys.vh - FLOOR_MARGIN;
    const wantDocked = () => parkedRef.current || openRef.current || liveRef.current;

    // parked spot = the screen edge, floor-level — clear of the chat bar
    // and everything in it.
    const dockX = () => phys.vw - SIZE * 0.6;

    const after = (ms: number, fn: () => void) => {
      const t = setTimeout(() => {
        phys.timers.delete(t);
        fn();
      }, ms);
      phys.timers.add(t);
      return t;
    };

    const collectPerches = () => {
      const explicit = Array.from(document.querySelectorAll<HTMLElement>("[data-perch]"));
      const explicitSet = new Set<Element>(explicit);
      const nested = new Set<Element>();
      explicit.forEach((el) => el.querySelectorAll("*").forEach((child) => nested.add(child)));
      // any real text/link/button/heading on the page is a landing pad — not
      // just the hand-tagged ones — as long as it's visible, sized, and not
      // inside a data-no-perch (background/decorative) zone.
      const auto = Array.from(document.querySelectorAll<HTMLElement>("h1, h2, h3, h4, p, a, button, li"))
        .filter((el) => !explicitSet.has(el) && !nested.has(el) && isPerchable(el));
      phys.perches = [...explicit, ...auto];
    };

    const showEl = (ref: React.RefObject<HTMLElement | null>, on: boolean) => {
      if (!ref.current) return;
      ref.current.style.opacity = on ? "1" : "0";
      ref.current.style.visibility = on ? "visible" : "hidden";
    };

    const bang = (ms?: number) => {
      const el = bangRef.current;
      if (!el) return;
      el.style.animation = "none";
      void el.offsetWidth;
      el.style.animation = "bangPop 0.4s cubic-bezier(0.22,0.7,0.16,1) both";
      showEl(bangRef, true);
      after(ms || 800, () => showEl(bangRef, false));
    };

    const say = (text: string, opts?: { force?: boolean; ttl?: number }) => {
      const o = opts || {};
      const now = Date.now();
      if (!o.force && now - phys.lastSay < COOLDOWN) return false;
      if (openRef.current || liveRef.current) return false; // chat panel owns the conversation
      phys.lastSay = now;
      const b = bubbleRef.current, t = bubbleTextRef.current, tail = tailRef.current;
      if (!b || !t) return false;
      t.textContent = text;
      const desired = Math.max(140, Math.min(phys.vw - 140, phys.x));
      const shift = desired - phys.x;
      b.style.transform = `translate(calc(-50% + ${shift}px), 0) scale(1)`;
      if (tail) tail.style.left = `calc(50% - ${shift}px)`;
      showEl(bubbleRef, true);
      after(o.ttl || 4800, () => {
        if (!bubbleRef.current) return;
        bubbleRef.current.style.transform = `translate(calc(-50% + ${shift}px), 6px) scale(0.94)`;
        showEl(bubbleRef, false);
      });
      return true;
    };

    const hideBubble = () => {
      if (!bubbleRef.current) return;
      bubbleRef.current.style.opacity = "0";
      bubbleRef.current.style.visibility = "hidden";
    };

    // ── expression ───────────────────────────────────────────────
    const setExprDom = (name: Expr) => {
      if (name === phys.curExpr) return;
      phys.curExpr = name;
      const map: Record<Expr, React.RefObject<SVGGElement | null>> = {
        content: fContent, happy: fHappy, scrunched: fScrunch,
        surprised: fSurprised, sleepy: fSleepy, thinking: fThinking,
      };
      (Object.keys(map) as Expr[]).forEach((k) => {
        map[k].current?.setAttribute("opacity", k === name ? "1" : "0");
      });
    };

    const effExpr = (): Expr => {
      const now = Date.now();
      if (phys.dragging && phys.dragMoved) return "surprised";
      if (phys.sleeping) return "sleepy";
      if (phys.aiThinking) return "thinking";
      if (phys.trExpr && now < phys.trUntil) return phys.trExpr;
      if (!phys.grounded && !phys.dragging) return phys.vy > 140 ? "scrunched" : "content";
      return "content";
    };

    const transient = (name: Expr, ms: number) => {
      phys.trExpr = name;
      phys.trUntil = Date.now() + ms;
    };

    const blink = () => {
      const g = faceRef.current;
      if (!g) return;
      g.setAttribute("transform", "translate(0 48) scale(1 0.12) translate(0 -48)");
      after(90, () => g && g.removeAttribute("transform"));
    };
    // ── movement ─────────────────────────────────────────────────
    const hop = (vy: number, vx: number) => {
      phys.vy = vy; phys.vx = vx;
      phys.grounded = false; phys.support = null;
      if (Math.abs(vx) > 20) phys.facingT = vx > 0 ? 1 : -1;
    };

    const anticipate = (fn: () => void) => {
      phys.s = 0.82; phys.ss = 0;
      after(130, fn);
    };

    const smallHop = () => {
      anticipate(() => {
        if (phys.dragging || phys.sleeping) return;
        let dvx = (Math.random() - 0.5) * 420;
        if (phys.x < 120) dvx = Math.abs(dvx);
        if (phys.x > phys.vw - 120) dvx = -Math.abs(dvx);
        hop(520 + Math.random() * 220, dvx);
      });
    };

    const hopToward = () => {
      anticipate(() => {
        if (phys.dragging || phys.sleeping) { phys.traveling = false; return; }
        const dx = phys.travelX - phys.x;
        const vy = 720 + Math.random() * 160;
        const T = (2 * vy) / G;
        hop(vy, Math.max(-560, Math.min(560, dx / T)));
        phys.hopsLeft--;
      });
    };

    const travelTo = (tx: number, onArrive?: () => void) => {
      phys.traveling = true;
      phys.travelX = tx;
      phys.hopsLeft = 7;
      phys.onArrive = onArrive || null;
      hopToward();
    };

    const squash = (impact: number) => {
      phys.s = Math.max(0.55, 1 - impact / 2600);
      phys.ss = 0;
    };

    const onLand = (impact: number, support: "floor" | HTMLElement) => {
      if (phys.thrown && impact > 430 && phys.bouncesLeft > 0) {
        squash(impact); blink();
        phys.vy = impact * REST; phys.vx *= 0.72; phys.bouncesLeft--;
        phys.grounded = false; phys.support = null;
        return;
      }
      phys.support = support; phys.grounded = true; phys.vy = 0;
      squash(impact); blink();
      const wasThrown = phys.thrown;
      phys.thrown = false;
      if (phys.firstLand) {
        phys.firstLand = false;
        bang(900);
        transient("happy", 1800);
        after(350, () => say(FIRST_LAND_LINE, { force: true, ttl: 5800 }));
        return;
      }
      if (support !== "floor") {
        const now = Date.now();
        const last = phys.perchSaidAt.get(support) || 0;
        if (now - last > 8000) {
          phys.perchSaidAt.set(support, now);
          const name = perchLabel(support);
          transient("happy", 1800);
          say(perchLine(name), { force: wasThrown || phys.dragMoved, ttl: 3600 });
        }
      }
      if (phys.traveling) {
        if (Math.abs(phys.x - phys.travelX) > 48 && phys.hopsLeft > 0) {
          after(70, hopToward);
          return;
        }
        phys.traveling = false; phys.vx = 0;
        const cb = phys.onArrive; phys.onArrive = null;
        if (cb) cb();
      } else phys.vx = 0;
    };

    // ── idle / muse scheduling ───────────────────────────────────
    const scheduleIdle = () => {
      after(2800 + Math.random() * 3400, () => {
        const ok = !phys.dragging && phys.grounded && !wantDocked() && !phys.sleeping &&
          !phys.traveling && !phys.aiThinking && !phys.teleporting;
        if (ok) {
          const onPerch = phys.support !== "floor";
          if (!onPerch && Math.random() < 0.26) {
            let tx = 90 + Math.random() * (phys.vw - 180);
            if (Math.abs(tx - phys.x) < phys.vw * 0.3)
              tx = phys.x > phys.vw / 2 ? 90 + Math.random() * phys.vw * 0.3 : phys.vw - 90 - Math.random() * phys.vw * 0.3;
            travelTo(tx);
          } else smallHop();
        }
        scheduleIdle();
      });
    };

    const scheduleMuse = () => {
      after(16000 + Math.random() * 14000, () => {
        if (Math.random() < 0.45 && !phys.sleeping && !phys.dragging && !phys.aiThinking && !wantDocked())
          say(pick(MUSES));
        scheduleMuse();
      });
    };

    // ── awareness ────────────────────────────────────────────────
    const markActivity = () => {
      phys.lastActivity = Date.now();
      if (phys.sleeping) {
        phys.sleeping = false;
        showEl(zzzRef, false);
        bang(800);
        transient("surprised", 1400);
        say(SLEEP_WAKE_LINE, { force: true, ttl: 3400 });
      }
    };

    const onScroll = () => {
      const now = performance.now();
      const sy = window.scrollY;
      if (phys.scrollPrevT) {
        const dt = Math.max(16, now - phys.scrollPrevT) / 1000;
        const v = Math.abs(sy - phys.scrollPrev) / dt;
        phys.scrollEMA = phys.scrollEMA * 0.8 + v * 0.2;
      }
      phys.scrollPrev = sy; phys.scrollPrevT = now;
      markActivity();
      const t = Date.now();
      if (phys.scrollEMA > 2600 && t - phys.lastScrollNote > 9000) {
        phys.lastScrollNote = t;
        transient("surprised", 1200);
        say(SCROLL_LINE);
      }
      const doc = document.documentElement;
      if (sy + phys.vh > doc.scrollHeight - 160 && t - phys.lastBottomNote > 30000) {
        phys.lastBottomNote = t;
        transient("happy", 1600);
        say(BOTTOM_LINE);
      }
    };

    const onHover = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const perch = target?.closest("[data-perch], h1, h2, h3, h4, p, a, button, li") ?? null;
      if (perch === phys.hoverEl) return;
      phys.hoverEl = perch;
      // chat busy (open/live) still suppresses ambient reactions, but merely
      // being parked shouldn't — he can still notice and comment on things
      if (!perch || perch.closest("[data-no-perch]") || openRef.current || liveRef.current || phys.dragging) return;
      markActivity();
      const rect = (perch as HTMLElement).getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      phys.facingT = cx > phys.x ? 1 : -1;
      transient("surprised", 1300);
      say(perchLine(perchLabel(perch)), { ttl: 2600 });
      // the hop-toward flourish would break his parked position, so only the
      // physical lunge (not the reaction itself) stays gated on docked state
      if (!wantDocked() && phys.grounded && !phys.traveling && Math.random() < 0.5) {
        const dx = Math.max(-200, Math.min(200, cx - phys.x));
        anticipate(() => { if (!phys.dragging) hop(480, dx * 1.6); });
      }
    };

    // ── poke / drag / throw ──────────────────────────────────────
    const poke = () => {
      phys.ss = -5.2;
      if (openRef.current || liveRef.current) {
        const now = Date.now();
        phys.pokeTimes = phys.pokeTimes.filter((t) => now - t < 6000);
        phys.pokeTimes.push(now);
        if (phys.pokeTimes.length >= 3) {
          transient("scrunched", 2000);
          say(POKE_ANNOYED, { force: true, ttl: 3200 });
          phys.pokeTimes = [];
        } else {
          transient("happy", 1400);
          if (phys.pokeTimes.length === 2) say(pick(POKE_LINES), { ttl: 2600 });
        }
      } else {
        transient("happy", 1400);
        openChat();
      }
    };

    const onSlimeDown = (e: PointerEvent) => {
      if (phys.teleporting) return;
      e.preventDefault();
      markActivity();
      const r = slimeEl.getBoundingClientRect();
      phys.dragDX = r.left + r.width / 2 - e.clientX;
      phys.dragDY = r.bottom - e.clientY;
      phys.dragStart = { x: e.clientX, y: e.clientY, t: Date.now() };
      phys.dragging = true; phys.dragMoved = false;
      phys.samples = [{ t: performance.now(), x: phys.x, by: phys.by }];
      phys.traveling = false; phys.thrown = false;
      slimeEl.style.cursor = "grabbing";
    };

    const pointerMove = (e: PointerEvent) => {
      phys.lastActivity = Date.now();
      if (!phys.dragging) return;
      if (!phys.dragMoved) {
        const st = phys.dragStart;
        if (st && Math.hypot(e.clientX - st.x, e.clientY - st.y) > 7) {
          phys.dragMoved = true;
          phys.grounded = false; phys.support = null;
          bang(600);
        } else return;
      }
      const px = e.clientX + phys.dragDX;
      phys.x = Math.max(28, Math.min(phys.vw - 28, px));
      phys.by = Math.max(80, Math.min(floorY(), e.clientY + phys.dragDY));
      const now = performance.now();
      phys.samples.push({ t: now, x: phys.x, by: phys.by });
      while (phys.samples.length > 2 && now - phys.samples[0].t > 110) phys.samples.shift();
    };

    const pointerUp = (e: PointerEvent) => {
      if (!phys.dragging) return;
      phys.dragging = false;
      slimeEl.style.cursor = "grab";
      const st = phys.dragStart;
      const dist = st ? Math.hypot(e.clientX - st.x, e.clientY - st.y) : 99;
      const held = st ? Date.now() - st.t : 999;
      if (!phys.dragMoved && dist < 7 && held < 280) { poke(); return; }
      const a = phys.samples[0], b = phys.samples[phys.samples.length - 1];
      let vx = 0, vy = 0;
      if (a && b && b.t > a.t) {
        const dt = (b.t - a.t) / 1000;
        vx = (b.x - a.x) / dt;
        vy = -((b.by - a.by) / dt);
      }
      const mag = Math.hypot(vx, vy);
      if (mag > 1700) { vx *= 1700 / mag; vy *= 1700 / mag; }
      phys.vx = vx; phys.vy = vy;
      phys.grounded = false; phys.support = null;
      phys.thrown = true; phys.bouncesLeft = 5;
      if (Math.abs(vx) > 30) phys.facingT = vx > 0 ? 1 : -1;
    };

    // ── teleport (route change) ──────────────────────────────────
    const showPortal = (x: number, by: number) => {
      const el = portalRef.current;
      if (!el) return;
      el.style.display = "none";
      void el.offsetWidth;
      el.style.display = "block";
      el.style.transform = `translate3d(${x - 95}px,${by - 170}px,0)`;
      el.style.visibility = "visible";
      el.style.opacity = "1";
    };
    const hidePortal = () => {
      const el = portalRef.current;
      if (!el) return;
      el.style.opacity = "0";
      after(190, () => { if (portalRef.current && portalRef.current.style.opacity === "0") portalRef.current.style.visibility = "hidden"; });
    };

    // Split into an OUT half and an IN half so a click can play the out
    // animation first — while the old page is still showing — and only
    // swap the route once he's actually gone, instead of the page jumping
    // instantly while the animation trails behind it.
    const playOut = (cb?: () => void) => {
      phys.teleporting = true;
      phys.traveling = false; phys.thrown = false;
      slimeEl.style.pointerEvents = "none";
      transient("surprised", 700);
      showPortal(phys.x, phys.by);
      after(110, () => { if (bodyRef.current) bodyRef.current.style.animation = "slimeOut 0.22s cubic-bezier(0.6,0,0.8,0.5) both"; });
      after(340, () => {
        slimeEl.style.opacity = "0";
        if (bodyRef.current) bodyRef.current.style.animation = "";
        hidePortal();
        if (cb) cb();
      });
    };

    const playIn = (tx: number, cb?: () => void) => {
      phys.teleporting = true; // stays frozen straight through from playOut
      after(120, () => {
        phys.x = Math.max(40, Math.min(phys.vw - 40, tx));
        phys.by = floorY();
        phys.grounded = true; phys.support = "floor"; phys.vx = 0; phys.vy = 0;
        phys.facingT = 1;
        showPortal(phys.x, phys.by);
      });
      after(260, () => {
        slimeEl.style.opacity = "1";
        if (bodyRef.current) bodyRef.current.style.animation = "slimeIn 0.26s cubic-bezier(0.2,0.9,0.3,1.15) both";
      });
      after(560, () => {
        if (bodyRef.current) bodyRef.current.style.animation = "";
        slimeEl.style.pointerEvents = "auto";
        phys.teleporting = false;
        phys.ss = -4; blink();
        if (cb) cb();
      });
      after(740, hidePortal);
    };

    // full out+in fallback for navigation that didn't go through the
    // pre-navigation click hook below (browser back/forward, programmatic
    // router.push from the chat panel, etc.)
    const teleportTo = (tx: number, cb?: () => void) => playOut(() => playIn(tx, cb));

    // ── main loop ────────────────────────────────────────────────
    const tick = (t: number) => {
      const dt = Math.min(0.032, (t - phys.lastT) / 1000);
      phys.lastT = t;
      const now = Date.now();

      if (!phys.teleporting && (!phys.dragging || !phys.dragMoved)) {
        if (phys.grounded) {
          const top = phys.support === "floor"
            ? floorY()
            : phys.support && phys.support.isConnected
              ? (() => {
                  const r = (phys.support as HTMLElement).getBoundingClientRect();
                  if (r.width < 10) return null;
                  if (phys.x < r.left + 6 || phys.x > r.right - 6) return null;
                  if (r.top < 60 || r.top > floorY() - 2) return null;
                  return r.top;
                })()
              : null;
          if (top === null) { phys.grounded = false; phys.support = null; phys.vy = 0; }
          else phys.by = top;
        }
        if (!phys.grounded && !phys.dragging) {
          const prevBy = phys.by;
          phys.vy -= G * dt;
          phys.by -= phys.vy * dt;
          phys.x += phys.vx * dt;
          if (phys.x < 28) { phys.x = 28; phys.vx = Math.abs(phys.vx) * 0.65; phys.facingT = 1; }
          if (phys.x > phys.vw - 28) { phys.x = phys.vw - 28; phys.vx = -Math.abs(phys.vx) * 0.65; phys.facingT = -1; }
          if (phys.vy < 0) {
            let land: "floor" | HTMLElement | null = null, landTop = Infinity;
            for (let i = 0; i < phys.perches.length; i++) {
              const p = phys.perches[i];
              if (!p.isConnected) continue;
              const r = p.getBoundingClientRect();
              if (r.width < 10 || r.top < 60 || r.top > floorY() - 2) continue;
              if (phys.x < r.left + 6 || phys.x > r.right - 6) continue;
              if (r.top >= prevBy - 2 && r.top <= phys.by && r.top < landTop) { land = p; landTop = r.top; }
            }
            if (!land && phys.by >= floorY()) { land = "floor"; landTop = floorY(); }
            if (land) { phys.by = landTop; onLand(Math.abs(phys.vy), land); }
          }
        }
      }

      phys.ss += ((1 - phys.s) * 170 - 13 * phys.ss) * dt;
      phys.s += phys.ss * dt;
      phys.s = Math.max(0.4, Math.min(1.5, phys.s));

      if (!phys.sleeping && now - phys.lastActivity > 22000 && phys.grounded && !phys.dragging &&
          !phys.aiThinking && !phys.teleporting && !wantDocked()) {
        phys.sleeping = true;
        showEl(zzzRef, true);
      }

      // discoverability nudge: catch him mid-roam near screen-center, point
      // back at the park button — spaced way out so it never nags.
      if (!wantDocked() && phys.grounded && !phys.dragging && !phys.traveling && !phys.sleeping &&
          Math.abs(phys.x - phys.vw / 2) < 70 && now - phys.lastHintAt > 40000) {
        phys.lastHintAt = now;
        setParkHint(true);
        after(4500, () => setParkHint(false));
      }

      setExprDom(effExpr());

      phys.facingC += (phys.facingT - phys.facingC) * Math.min(1, dt * 9);
      const parkedT = wantDocked() ? 1 : 0;
      phys.parkedF += (parkedT - phys.parkedF) * Math.min(1, dt * 5);
      const pk = 1 - phys.parkedF * 0.22;

      const breath = phys.grounded && !phys.dragging ? 0.015 * Math.sin(t / 460) : 0;
      const airK = phys.grounded || phys.dragging ? 0 : Math.min(0.3, Math.abs(phys.vy) / 2200);
      const sy = (phys.s * (1 + airK) + breath) * pk;
      const sx = (2 - phys.s) * (1 - airK * 0.5) * pk;
      const tilt = phys.grounded || phys.dragging ? 0 : Math.max(-0.16, Math.min(0.16, phys.vx * 0.00014));

      slimeEl.style.transform = `translate3d(${phys.x - SIZE / 2}px,${phys.by - H}px,0)`;
      if (!phys.teleporting)
        bodyEl.style.transform = `rotate(${tilt}rad) scale(${sx * phys.facingC},${sy})`;
      if (shadowRef.current) {
        let ground = floorY();
        for (let i = 0; i < phys.perches.length; i++) {
          const p = phys.perches[i];
          if (!p.isConnected) continue;
          const r = p.getBoundingClientRect();
          if (r.width < 10 || r.top < 60 || r.top > floorY() - 2) continue;
          if (phys.x < r.left + 6 || phys.x > r.right - 6) continue;
          if (r.top >= phys.by - 2 && r.top < ground) ground = r.top;
        }
        const dist = Math.max(0, ground - phys.by);
        const sc = Math.max(0.3, Math.min(1, 1 - dist / 420));
        shadowRef.current.style.transform = `translate3d(${phys.x - SIZE * 0.37}px,${ground - SIZE * 0.075}px,0) scale(${sc})`;
        shadowRef.current.style.opacity = String(0.55 * sc);
      }
    };

    // ── engine surface exposed to React state effects ─────────────
    engineRef.current = {
      onRouteChange(path: string) {
        // chat busy (open/live) still skips the dance — mid-conversation
        // isn't the moment for a portal flourish. Merely parked still
        // teleports, just back to the dock spot instead of a roam spot.
        if (openRef.current || liveRef.current || phys.dragging) return;
        const tx = parkedRef.current
          ? dockX()
          : phys.vw * (0.25 + Math.random() * 0.5);
        const cb = () => {
          transient("happy", 1800);
          say(pick(commentsFor(path)), { force: true, ttl: 5200 });
        };
        // the pre-navigation click hook (onDocClick) already plays the out
        // half before the route actually changes, so by the time this fires
        // phys.teleporting is already true — just finish with the in half.
        // Navigation that skipped the hook (browser back/forward, a
        // router.push from the chat panel) still gets the full sequence.
        if (phys.teleporting) playIn(tx, cb);
        else teleportTo(tx, cb);
      },
      hideBubble,
      dock() {
        travelTo(dockX(), () => say(PARK_LINE, { force: true, ttl: 3200 }));
      },
      undock() {
        transient("happy", 1600);
        say(UNPARK_LINE, { force: true, ttl: 2600 });
        travelTo(phys.vw * (0.3 + Math.random() * 0.4));
      },
      startThinkingFX() {
        phys.aiThinking = true;
        showEl(dotsRef, true);
      },
      stopThinkingFX() {
        phys.aiThinking = false;
        showEl(dotsRef, false);
        transient("happy", 2200);
        phys.ss = -4;
      },
      destroy() {
        cancelAnimationFrame(phys.raf);
        phys.timers.forEach((tm) => clearTimeout(tm));
      },
    };

    // ── listeners ───────────────────────────────────────────────
    const onResize = () => {
      phys.vw = window.innerWidth; phys.vh = window.innerHeight;
      phys.x = Math.max(40, Math.min(phys.vw - 40, phys.x));
    };
    const onPointerMove = (e: PointerEvent) => pointerMove(e);
    const onPointerUp = (e: PointerEvent) => pointerUp(e);
    const onScrollWin = () => onScroll();
    const onAct = () => markActivity();
    const onHoverWin = (e: MouseEvent) => onHover(e);
    const onDown = (e: PointerEvent) => onSlimeDown(e);

    // pre-navigation hook: play the teleport-out half BEFORE the route
    // actually changes (instead of after, which is why it used to look
    // like he'd "jump away" and then teleport late) — intercept the click
    // on an internal <a>, let him vanish into the portal, and only then
    // actually navigate. onRouteChange (below) picks up with the in half.
    const onDocClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest("a");
      if (!a || a.closest("[data-no-perch]")) return;
      const href = a.getAttribute("href");
      if (!href || !href.startsWith("/") || href.startsWith("//")) return;
      if (a.hasAttribute("download")) return;
      const target = a.getAttribute("target");
      if (target && target !== "_self") return;
      let dest: URL;
      try { dest = new URL(href, window.location.href); } catch { return; }
      if (dest.pathname === window.location.pathname) return; // hash/query-only, same page
      if (openRef.current || liveRef.current || phys.dragging || phys.teleporting) return;
      e.preventDefault();
      playOut(() => routerRef.current.push(href));
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("scroll", onScrollWin, { passive: true });
    window.addEventListener("pointerdown", onAct);
    window.addEventListener("keydown", onAct);
    window.addEventListener("wheel", onAct, { passive: true });
    document.addEventListener("mouseover", onHoverWin);
    document.addEventListener("click", onDocClick, true);
    slimeEl.addEventListener("pointerdown", onDown);

    collectPerches();
    const perchInterval = setInterval(collectPerches, 3000);

    phys.lastT = performance.now();
    const loop = (t: number) => { tick(t); phys.raf = requestAnimationFrame(loop); };
    phys.raf = requestAnimationFrame(loop);

    scheduleIdle();
    scheduleMuse();

    return () => {
      engineRef.current?.destroy();
      engineRef.current = null;
      clearInterval(perchInterval);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("scroll", onScrollWin);
      window.removeEventListener("pointerdown", onAct);
      window.removeEventListener("keydown", onAct);
      window.removeEventListener("wheel", onAct);
      document.removeEventListener("mouseover", onHoverWin);
      document.removeEventListener("click", onDocClick, true);
      slimeEl.removeEventListener("pointerdown", onDown);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── route-change teleport ────────────────────────────────────────
  // useLayoutEffect (not useEffect): must run synchronously right after the
  // new route commits, before the next animation frame — otherwise the rAF
  // loop can see his old perch vanish (unmounted with the old page) and let
  // gravity yank him down for a frame or two before the deliberate teleport
  // even starts, which read as an abrupt unscripted "jump" before the real
  // out/in animation kicked in late.
  useLayoutEffect(() => {
    if (firstPathRef.current) { firstPathRef.current = false; return; }
    engineRef.current?.onRouteChange(pathname);
  }, [pathname]);

  // ── docked (park / chat open / live) transitions ─────────────────
  const wasDockedRef = useRef(false);
  useEffect(() => {
    const wantDocked = parked || open || live;
    if (wantDocked === wasDockedRef.current) return;
    wasDockedRef.current = wantDocked;
    const engine = engineRef.current;
    if (!engine) return;
    if (wantDocked) engine.dock();
    else engine.undock();
  }, [parked, open, live]);

  // ── AI-thinking visual feedback on the character itself ──────────
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (busy) engine.startThinkingFX();
    else engine.stopThinkingFX();
  }, [busy]);

  return (
    <div data-no-perch>
      <style>{RIMURU_CSS}</style>

      {/* ── physics slime + portal + shadow ─────────────────────── */}
      <div className="pointer-events-none fixed inset-0 z-[422] overflow-hidden">
        <div
          ref={shadowRef}
          style={{
            position: "absolute", left: 0, top: 0,
            width: SIZE * 0.74, height: SIZE * 0.15, borderRadius: "50%",
            background: "rgba(0,0,0,0.5)", filter: "blur(4px)",
            willChange: "transform, opacity",
          }}
        />

        <div
          ref={portalRef}
          style={{
            position: "absolute", left: 0, top: 0, width: 190, height: 170,
            opacity: 0, visibility: "hidden", pointerEvents: "none",
            transition: "opacity 0.18s ease", willChange: "transform, opacity",
          }}
        >
          <div style={{ position: "absolute", left: "22%", right: "22%", bottom: 0, height: 130, background: "linear-gradient(to top, rgba(127,208,255,0.3), rgba(127,208,255,0))", filter: "blur(7px)" }} />
          <span style={{ position: "absolute", bottom: 0, left: "24%", width: 2.5, height: 60, background: "linear-gradient(to top, #bfe9ff, rgba(127,208,255,0))", borderRadius: 2, boxShadow: "0 0 8px #4aa6f5", animation: "beamRise 1.2s ease-out 0s infinite" }} />
          <span style={{ position: "absolute", bottom: 0, left: "38%", width: 2.5, height: 95, background: "linear-gradient(to top, #bfe9ff, rgba(127,208,255,0))", borderRadius: 2, boxShadow: "0 0 8px #4aa6f5", animation: "beamRise 1.4s ease-out 0.35s infinite" }} />
          <span style={{ position: "absolute", bottom: 0, left: "50%", width: 3, height: 120, background: "linear-gradient(to top, #dff3ff, rgba(127,208,255,0))", borderRadius: 2, boxShadow: "0 0 10px #4aa6f5", animation: "beamRise 1.1s ease-out 0.15s infinite" }} />
          <span style={{ position: "absolute", bottom: 0, left: "61%", width: 2.5, height: 80, background: "linear-gradient(to top, #bfe9ff, rgba(127,208,255,0))", borderRadius: 2, boxShadow: "0 0 8px #4aa6f5", animation: "beamRise 1.5s ease-out 0.55s infinite" }} />
          <span style={{ position: "absolute", bottom: 0, left: "73%", width: 2.5, height: 105, background: "linear-gradient(to top, #bfe9ff, rgba(127,208,255,0))", borderRadius: 2, boxShadow: "0 0 8px #4aa6f5", animation: "beamRise 1.3s ease-out 0.75s infinite" }} />
          <span style={{ position: "absolute", bottom: 0, left: "45%", width: 2, height: 70, background: "linear-gradient(to top, #bfe9ff, rgba(127,208,255,0))", borderRadius: 2, boxShadow: "0 0 8px #4aa6f5", animation: "beamRise 1.6s ease-out 0.95s infinite" }} />
          <div style={{ position: "absolute", bottom: 0, left: "50%", width: 190, height: 190, transform: "translate(-50%, 50%) scaleY(0.32)", animation: "portalPop 0.3s cubic-bezier(0.2,0.9,0.3,1.1) both" }}>
            <div style={{ position: "absolute", inset: 0, border: "2px dashed #4aa6f5", borderRadius: "50%", opacity: 0.8, boxShadow: "0 0 12px rgba(74,166,245,0.5)", animation: "ringSpin 7s linear infinite" }} />
            <div style={{ position: "absolute", inset: "16%", border: "4px solid #7fd0ff", borderLeftColor: "#dff3ff", borderTopColor: "rgba(127,208,255,0.25)", borderRadius: "50%", boxShadow: "0 0 24px #4aa6f5, inset 0 0 18px rgba(127,208,255,0.6)", animation: "ringSpinR 4.5s linear infinite" }} />
            <div style={{ position: "absolute", inset: "32%", border: "2px solid #bfe9ff", borderRadius: "50%", opacity: 0.9, boxShadow: "0 0 14px #7fd0ff" }} />
            <div style={{ position: "absolute", inset: "42%", borderRadius: "50%", background: "radial-gradient(circle, rgba(191,233,255,0.9), rgba(74,166,245,0.25) 60%, transparent 75%)", animation: "corePulse 1.2s ease-in-out infinite" }} />
          </div>
        </div>

        <div
          ref={slimeRef}
          role="button"
          tabIndex={0}
          aria-label="Talk to, poke, or drag Rimuru"
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openChat(); } }}
          style={{
            position: "absolute", left: 0, top: 0, width: SIZE, height: H,
            pointerEvents: "auto", cursor: "grab", touchAction: "none",
            willChange: "transform", userSelect: "none",
          }}
        >
          <div ref={bodyRef} style={{ width: "100%", height: "100%", transformOrigin: "50% 98%", willChange: "transform" }}>
            <svg viewBox="0 0 120 90" style={{ width: "100%", height: "100%", overflow: "visible", display: "block" }}>
              <defs>
                <radialGradient id="rimuru-fill" cx="42%" cy="34%" r="72%">
                  <stop offset="0" stopColor="#bfe9ff" />
                  <stop offset="0.55" stopColor="#7fd0ff" />
                  <stop offset="1" stopColor="#4aa6f5" />
                </radialGradient>
              </defs>
              <path d="M60 12 C62 3 72 4 69 11" fill="none" stroke="#9adcff" strokeWidth="3" strokeLinecap="round" />
              <path d="M60 12 C86 12 102 34 102 57 C102 76 85 88 60 88 C35 88 18 76 18 57 C18 34 34 12 60 12 Z" fill="url(#rimuru-fill)" />
              <ellipse cx="62" cy="60" rx="30" ry="21" fill="#5eb2f0" opacity="0.45" />
              <ellipse cx="38" cy="27" rx="14" ry="8" fill="#ffffff" opacity="0.75" transform="rotate(-24 38 27)" />
              <ellipse cx="23" cy="42" rx="4" ry="7" fill="#ffffff" opacity="0.5" transform="rotate(-18 23 42)" />
              <circle cx="88" cy="33" r="3" fill="#dff3ff" opacity="0.7" />
              <g ref={faceRef}>
                <g ref={fContent} opacity={1} fill="none" stroke="#0d2b40" strokeWidth="3.2" strokeLinecap="round">
                  <path d="M30 46 Q42 37 54 45" />
                  <path d="M66 45 Q78 37 90 46" />
                </g>
                <g ref={fHappy} opacity={0} strokeLinecap="round">
                  <ellipse cx="28" cy="57" rx="7.5" ry="3.8" fill="#f5b8d0" opacity="0.85" />
                  <ellipse cx="92" cy="57" rx="7.5" ry="3.8" fill="#f5b8d0" opacity="0.85" />
                  <path d="M29 45 Q42 35 55 44" fill="none" stroke="#0d2b40" strokeWidth="3.2" />
                  <path d="M65 44 Q78 35 91 45" fill="none" stroke="#0d2b40" strokeWidth="3.2" />
                  <path d="M55 61 Q60 66 65 61" fill="none" stroke="#0d2b40" strokeWidth="2.6" />
                </g>
                <g ref={fScrunch} opacity={0} fill="none" stroke="#0d2b40" strokeLinecap="round">
                  <path d="M26 42 Q44 48 54 55" strokeWidth="3.6" />
                  <path d="M44 59 L52 54" strokeWidth="2.4" />
                  <path d="M94 42 Q76 48 66 55" strokeWidth="3.6" />
                  <path d="M76 59 L68 54" strokeWidth="2.4" />
                </g>
                <g ref={fSurprised} opacity={0} strokeLinecap="round">
                  <path d="M34 34 Q42 29 50 33" fill="none" stroke="#0d2b40" strokeWidth="2.4" />
                  <path d="M70 33 Q78 29 86 34" fill="none" stroke="#0d2b40" strokeWidth="2.4" />
                  <circle cx="42" cy="48" r="5.5" fill="#0d2b40" />
                  <circle cx="78" cy="48" r="5.5" fill="#0d2b40" />
                  <circle cx="43.6" cy="46.4" r="1.8" fill="#ffffff" />
                  <circle cx="79.6" cy="46.4" r="1.8" fill="#ffffff" />
                  <circle cx="60" cy="64" r="2.6" fill="none" stroke="#0d2b40" strokeWidth="2.2" />
                </g>
                <g ref={fSleepy} opacity={0} fill="none" stroke="#0d2b40" strokeLinecap="round">
                  <path d="M32 49 Q43 53 54 50" strokeWidth="3.2" />
                  <path d="M66 50 Q77 53 88 49" strokeWidth="3.2" />
                  <path d="M56 66 L60 62 L64 66" strokeWidth="2.4" />
                </g>
                <g ref={fThinking} opacity={0} fill="none" stroke="#0d2b40" strokeLinecap="round">
                  <path d="M32 48 L54 48" strokeWidth="3.2" />
                  <path d="M66 45 Q78 37 90 44" strokeWidth="3.2" />
                </g>
              </g>
            </svg>
            <div ref={bangRef} style={{ position: "absolute", top: -26, right: -4, fontWeight: 800, fontSize: 30, color: "#cfeeff", textShadow: "0 2px 10px rgba(74,166,245,0.7)", opacity: 0, visibility: "hidden" }}>!</div>
            <div ref={zzzRef} className="font-mono" style={{ position: "absolute", top: -22, right: 2, fontWeight: 500, color: "var(--mut)", opacity: 0, visibility: "hidden" }}>
              <span style={{ position: "absolute", fontSize: 13, animation: "zzzFloat 2.4s linear infinite" }}>z</span>
              <span style={{ position: "absolute", fontSize: 11, animation: "zzzFloat 2.4s linear 0.8s infinite" }}>z</span>
              <span style={{ position: "absolute", fontSize: 9, animation: "zzzFloat 2.4s linear 1.6s infinite" }}>z</span>
            </div>
            <div ref={dotsRef} style={{ position: "absolute", top: -24, right: -14, display: "flex", gap: 4, background: "var(--bg)", border: "1px solid var(--ln)", borderRadius: 999, padding: "6px 9px", opacity: 0, visibility: "hidden" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#7fd0ff", animation: "dotPulse 1.1s ease-in-out infinite" }} />
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#7fd0ff", animation: "dotPulse 1.1s ease-in-out 0.18s infinite" }} />
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#7fd0ff", animation: "dotPulse 1.1s ease-in-out 0.36s infinite" }} />
            </div>
          </div>

          <div
            ref={bubbleRef}
            aria-live="polite"
            className="font-sans"
            style={{
              position: "absolute", bottom: H + 14, left: "50%",
              transform: "translate(-50%, 6px) scale(0.94)", width: "max-content", maxWidth: 240,
              background: "var(--bg)", border: "1px solid var(--ln)", borderRadius: 14, padding: "9px 13px",
              opacity: 0, visibility: "hidden", transition: "opacity 0.2s ease, transform 0.2s ease",
              boxShadow: "0 14px 44px rgba(0,0,0,0.4)", pointerEvents: "none",
            }}
          >
            <div className="font-mono" style={{ fontSize: 8, letterSpacing: "0.2em", color: "var(--acc)", marginBottom: 4 }}>RIMURU</div>
            <div ref={bubbleTextRef} style={{ fontSize: 12.5, lineHeight: 1.45, color: "var(--ink)" }} />
            <span ref={tailRef} style={{ position: "absolute", bottom: -5, left: "50%", width: 9, height: 9, transform: "translateX(-50%) rotate(45deg)", background: "var(--bg)", borderRight: "1px solid var(--ln)", borderBottom: "1px solid var(--ln)" }} />
          </div>
        </div>
      </div>

      {/* ── control center — park / unpark only ─────────────────── */}
      <button
        onClick={() => setParked((p) => !p)}
        aria-label={parked ? "Unpark Rimuru" : "Park Rimuru"}
        className="pointer-events-auto fixed right-3 top-[4.75rem] z-[430] rounded-full border border-ln bg-bg/85 px-4 py-2 font-mono text-[10px] tracking-[0.16em] text-mut backdrop-blur-xl transition-colors hover:border-acc hover:text-acc sm:top-20"
        style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}
      >
        {parked ? "UNPARK RIMURU" : "PARK RIMURU"}
      </button>

      {/* ── periodic "click here to park" callout, pointing at the button ── */}
      <div
        aria-hidden={!parkHint}
        className="pointer-events-none fixed right-3 top-[7.7rem] z-[429] max-w-[190px] rounded-2xl border border-ln bg-bg/90 px-3.5 py-2.5 font-sans text-[11.5px] leading-snug text-ink backdrop-blur-xl transition-all duration-300 sm:top-[8.2rem]"
        style={{
          boxShadow: "0 14px 40px rgba(0,0,0,0.35)",
          opacity: parkHint ? 1 : 0,
          transform: parkHint ? "translateY(0)" : "translateY(-6px)",
        }}
      >
        <span className="absolute -top-1.5 right-6 h-3 w-3 rotate-45 border-l border-t border-ln bg-bg" />
        Want me still? Click here to park me.
      </div>

      {/* ── ambient docked bar (Gemini-style, non-blocking) ────────── */}
      <div data-perch="THE CHAT BAR" className="pointer-events-none fixed inset-x-0 bottom-0 z-[420] flex justify-center px-3 pb-4">
        <div className="flex w-full max-w-[580px] flex-col items-stretch gap-2">
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 14 }}
                className="pointer-events-auto overflow-hidden rounded-3xl border border-ln bg-bg/90 backdrop-blur-2xl"
                style={{ boxShadow: "0 30px 90px rgba(0,0,0,0.5)" }}
              >
                <div className="flex items-center justify-between px-4 pt-3">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6"><Slime /></span>
                    <span className="font-display text-sm font-medium text-ink">Rimuru</span>
                    <span className="font-mono text-[9px] tracking-[0.14em] text-mut">ON-SITE GUIDE</span>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="font-mono text-xs text-mut transition-colors hover:text-ink"
                    aria-label="Minimize chat"
                  >
                    ⌄
                  </button>
                </div>
                <div ref={scrollRef} className="max-h-[46vh] min-h-[120px] space-y-3 overflow-y-auto px-4 py-3">
                  {msgs.map((m, i) => (
                    <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 font-sans text-[13.5px] leading-relaxed ${
                          m.role === "user"
                            ? "bg-acc text-[color:var(--bg)]"
                            : "border border-ln text-ink"
                        }`}
                      >
                        <span className="whitespace-pre-wrap">{m.text}</span>
                        {m.actions && (
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {m.actions.map((a, j) => (
                              <button
                                key={j}
                                onClick={() => doAction(a)}
                                className="rounded-full border border-ln px-3 py-1 font-mono text-[10px] tracking-[0.1em] text-acc transition-colors hover:border-acc"
                              >
                                {a.label} ↗
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {busy && (
                    <div className="font-mono text-[10px] tracking-[0.16em] text-mut">RIMURU IS THINKING…</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* the pill itself — always docked */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
              setOpen(true);
            }}
            className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-ln bg-bg/85 py-2 pl-2 pr-2.5 backdrop-blur-2xl"
            style={{ boxShadow: "0 16px 50px rgba(0,0,0,0.4)" }}
          >
            <button
              type="button"
              onClick={startLive}
              aria-label="Go live with Rimuru"
              className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-mut transition-colors hover:text-acc"
              title="Go live — voice & camera"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="3" y="6" width="12" height="12" rx="3" />
                <path d="M15 10l6-3v10l-6-3z" />
              </svg>
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setOpen(true)}
              placeholder={listening ? "Listening…" : "Ask Rimuru"}
              className="min-w-0 flex-1 bg-transparent px-1 font-sans text-[14px] text-ink outline-none placeholder:text-mut"
              suppressHydrationWarning
            />
            <button
              type="button"
              onClick={toggleMic}
              aria-label="Voice input"
              className="flex h-9 w-9 flex-none items-center justify-center rounded-full transition-colors"
              style={{
                background: listening ? "var(--acc)" : "transparent",
                color: listening ? "var(--bg)" : "var(--mut)",
              }}
            >
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7">
                <rect x="9" y="3" width="6" height="12" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v3" strokeLinecap="round" />
              </svg>
            </button>
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Send"
              className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-acc font-sans text-[color:var(--bg)] transition-opacity disabled:opacity-30"
            >
              ↑
            </button>
          </form>
        </div>
      </div>

      {/* ── live call ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {live && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[440] flex flex-col items-center justify-end bg-black/70 backdrop-blur-sm"
          >
            <button className="absolute inset-0" aria-label="Minimize call" onClick={endLive} />
            <motion.div
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              exit={{ y: 40 }}
              className="relative z-10 mb-5 w-[min(440px,calc(100vw-1.5rem))] overflow-hidden rounded-3xl border border-ln bg-bg/95 backdrop-blur-2xl"
              style={{ boxShadow: "0 40px 120px rgba(0,0,0,0.6)" }}
            >
              <div className="relative flex h-56 items-center justify-center overflow-hidden bg-black">
                <video ref={videoRef} autoPlay muted playsInline className="h-full w-full scale-x-[-1] object-cover opacity-90" />
                <div className="pointer-events-none absolute inset-0 flex items-end justify-between p-3">
                  <span className="rounded-full bg-black/50 px-2.5 py-1 font-mono text-[9px] tracking-[0.14em] text-white">
                    {!listening ? "● CONNECTING…" : liveMuted ? "● LIVE — MUTED" : "● LIVE — LISTENING"}
                  </span>
                  <span className="h-11 w-11 rounded-full bg-bg/90 p-1"><Slime /></span>
                </div>
              </div>
              <div className="min-h-[52px] px-4 py-3">
                <p className="font-sans text-[13.5px] leading-relaxed text-ink">
                  {msgs[msgs.length - 1]?.text ?? (listening ? "Speak — I'm listening." : "Connecting…")}
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 border-t border-ln p-3">
                <button
                  onClick={toggleLiveMute}
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-ln text-ink"
                  style={{ background: liveMuted ? "var(--acc)" : "transparent", color: liveMuted ? "var(--bg)" : "var(--ink)" }}
                  aria-label={liveMuted ? "Unmute mic" : "Mute mic"}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <rect x="9" y="3" width="6" height="12" rx="3" />
                    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" strokeLinecap="round" />
                    {liveMuted && <path d="M4 4l16 16" strokeLinecap="round" />}
                  </svg>
                </button>
                <button
                  onClick={endLive}
                  className="flex h-12 items-center gap-2 rounded-full bg-acc px-6 font-sans text-sm font-medium text-[color:var(--bg)]"
                  aria-label="End call"
                >
                  End
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** small static icon used in the chat header / live-call overlay */
function Slime() {
  return (
    <svg viewBox="0 0 40 40" className="h-full w-full overflow-visible">
      <defs>
        <radialGradient id="rimuru-fill-mini" cx="42%" cy="34%" r="72%">
          <stop offset="0" stopColor="#bfe9ff" />
          <stop offset="0.55" stopColor="#7fd0ff" />
          <stop offset="1" stopColor="#4aa6f5" />
        </radialGradient>
      </defs>
      <ellipse cx="20" cy="35" rx="12" ry="2.4" fill="var(--acc)" opacity="0.22" />
      <path d="M20 5c1.2-2.4 3.6-2.2 3 .6" fill="none" stroke="#7fd0ff" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M20 7c7 0 12 7 12 14 0 6.2-4.8 10-12 10S8 27.2 8 21C8 14 13 7 20 7Z"
        fill="url(#rimuru-fill-mini)"
      />
      <ellipse cx="15" cy="16" rx="3" ry="2" fill="#fff" opacity="0.55" />
      <circle cx="15.5" cy="20" r="2.1" fill="#0b2a3f" />
      <circle cx="24.5" cy="20" r="2.1" fill="#0b2a3f" />
      <circle cx="16.2" cy="19.3" r="0.7" fill="#fff" />
      <circle cx="25.2" cy="19.3" r="0.7" fill="#fff" />
      <path d="M17 25c1.6 1.5 4.4 1.5 6 0" stroke="#0b2a3f" strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

const RIMURU_CSS = `
@keyframes bangPop { 0% { transform: scale(0) rotate(-16deg); opacity: 0; } 45% { transform: scale(1.3) rotate(7deg); opacity: 1; } 100% { transform: scale(1) rotate(0deg); opacity: 1; } }
@keyframes zzzFloat { 0% { transform: translate(0px, 0px) scale(0.7); opacity: 0; } 25% { opacity: 0.9; } 100% { transform: translate(16px, -34px) scale(1.2); opacity: 0; } }
@keyframes dotPulse { 0%, 80%, 100% { opacity: 0.25; transform: translateY(0px); } 40% { opacity: 1; transform: translateY(-3px); } }
@keyframes ringSpin { to { transform: rotate(1turn); } }
@keyframes ringSpinR { to { transform: rotate(-1turn); } }
@keyframes corePulse { 0%, 100% { transform: scale(1); opacity: 0.85; } 50% { transform: scale(1.18); opacity: 1; } }
@keyframes beamRise { 0% { transform: translateY(16px) scaleY(0.3); opacity: 0; } 25% { opacity: 1; } 100% { transform: translateY(-74px) scaleY(1.05); opacity: 0; } }
@keyframes portalPop { from { transform: translate(-50%, 50%) scaleY(0.32) scale(0.2); opacity: 0; } to { transform: translate(-50%, 50%) scaleY(0.32) scale(1); opacity: 1; } }
@keyframes slimeOut { 0% { transform: scale(1, 1); opacity: 1; filter: brightness(1); } 40% { transform: translateY(-6px) scale(0.82, 1.3); opacity: 1; filter: brightness(1.6); } 100% { transform: translateY(-52px) scale(0.1, 2.3); opacity: 0; filter: brightness(2.4); } }
@keyframes slimeIn { 0% { transform: translateY(-52px) scale(0.1, 2.3); opacity: 0; filter: brightness(2.4); } 55% { transform: translateY(0px) scale(0.86, 1.22); opacity: 1; filter: brightness(1.5); } 80% { transform: scale(1.14, 0.82); filter: brightness(1.1); } 100% { transform: scale(1, 1); opacity: 1; filter: brightness(1); } }
`;
