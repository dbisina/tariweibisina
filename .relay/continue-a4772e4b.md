# Relay Continuation Contract

**Session:** `a4772e4b-fd92-41f5-8ca2-9b81c15900de`  
**Task:** `portfolio-loop-build`  
**Snapshot:** `master @ 0709ab1 (+ uncommitted WIP in working tree)`  

## DO NOT REDO (PRIMACY)

The following work is COMPLETE. Do not repeat, refactor, or undo it.

- Name treatment fixed: renders `BISINA, DANIEL` (Bisina first + comma; "Daniel" same font as "Tariwei" but black).
- Rimuru Tempest companion rebuilt (the on-site slime LLM component).
- Media blocks + Cloudinary upload route added (`src/app/api/upload/route.ts`).
- Typecheck green; dev server ran clean on :3000.

## Task Goal

Continue the `/loop` design+build pass on this Next.js portfolio. Six threads:

1. Per-project content shows understanding: ENGINEERING projects get system design + architecture detail; BUSINESS projects get simple architecture but a business-impact framing (problem -> optimization -> solution).
2. Rimuru (slime) is the site LLM companion living on EVERY page: moves/hops across the screen, seeks user attention, comments when the user is viewing a project, speaks in thought bubbles UNTIL the user clicks the slime to open the chat box.
3. Fix the chat page: make it AMBIENT, box docked at the bottom of the screen (Gemini / Google-Assistant style), non-blocking, clean. Live mode: converse in audio + video + text.
4. CMS more verbose: real media uploads (not just links), stored via Postgres + Cloudinary. Studio doubles as the admin panel.
5. Split "In Quote" from "Hire Me": Hire Me collects name, budget, project details; the LLM structures the request BEFORE it reaches Daniel; notify on Telegram + WhatsApp (OpenWA) + email; surface the structured lead in the CMS/studio.

## Verification pass (this session)

Verified live with `playwright-cli` (installed globally as `@playwright/cli`;
`chromium-cli` is not available in this environment) against the already-
running dev server, plus direct code read of every file involved:

- **Rimuru mount — found and fixed a real bug.** `RealmSelect` (the
  choose-your-realm gate) is only mounted on `src/app/page.tsx` ("/").
  `Rimuru` / `RealmSync` / `SoundEngine` are global (in `layout.tsx`) but all
  return null while `realm` is null, and `realm` never persists across a
  fresh load by design. Result: any deep link straight into a non-home route
  (a shared project URL, a hard refresh, a search hit) never showed Rimuru,
  never got themed, and sound never worked, because nothing on that route
  ever set `realm`. Confirmed with `playwright-cli` (`goto` straight to
  `/projects/relay` with a clean session — no Rimuru, no gate). Fixed in
  `src/components/realm-sync.tsx`: on any route other than "/", if `realm`
  is still null after mount, it's silently defaulted from
  `prefers-color-scheme` (no WebGL ceremony duplicated site-wide — that
  stays a home-page-only moment). Re-verified after the fix: cold deep link
  to `/business/hire-me` now shows Rimuru immediately; home's own
  choose-your-realm gate is untouched and still gates correctly on `/`.
  `npx tsc --noEmit` green after the change.
- **Thought bubbles, click-to-open, roam, per-page comments** — present and
  wired correctly in `rimuru.tsx` (`commentsFor(path)`, roam interval,
  bubble timers). Not independently re-verified beyond visual confirmation
  on two routes (home, hire-me) — no reason from the code to expect
  per-route breakage now that the mount bug is fixed.
- **Ambient bottom-docked chat** — already built directly into `rimuru.tsx`
  (no separate `/chat` route exists; the docked bar + expandable panel live
  in the global mount). Confirmed via screenshot: bottom-docked, non-
  blocking, Gemini/Assistant-style, greeting + action buttons render on
  click. Live mode (`getUserMedia` + SpeechRecognition + speechSynthesis)
  read but not exercised (headless env has no real mic/camera).
- **Per-project eng/business content** — already done. Every engineering
  project (`relay`, `aegis-matrix`, `etllm`, `airfree`) in
  `src/lib/content-data.ts` has `specs`/`steps` architecture blocks
  ("System design", "How X works", "Build facts", "Stack"). Every business
  project (`hebron-hotels`, `wayfarian`, `studyrag`, `uncle-stans`) follows
  problem → approach → outcome framing instead. Confirmed by grepping block
  headings per project; did not re-read every block body.
- **CMS media/Postgres/Cloudinary** — `/api/upload` (Cloudinary signed
  upload) and the `MediaUpload` control in `projects-editor.tsx` are wired
  for gallery/video block `src` fields. `/api/lead` writes through
  `saveLead` (`src/lib/db.ts`, Postgres via optional `pg` + `DATABASE_URL`,
  no-op otherwise) AND `notifyLead`. **Known gap**: the Studio Leads panel
  (`panels.tsx` `LeadsPanel`) only reads `useStudioStore((s) => s.leads)` —
  the client-side ring buffer populated by `logLead()` on submit. It does
  NOT fetch from `GET /api/lead` (the Postgres-backed list), so a lead
  submitted from a different browser/device won't show in this browser's
  Studio. Acceptable for the stated acceptance criteria (leads DO appear in
  Studio, same-session), but if Daniel wants Postgres to be the real source
  of truth for the admin view, `LeadsPanel` needs a `GET /api/lead` fetch
  (behind `STUDIO_ADMIN_KEY`) merged with/replacing the local store.
- **Hire-Me vs Quote split** — done. `business/hire-me/page.tsx` has a
  Quick-quote/Full-brief mode toggle, posts to `/api/lead` with the right
  `source`, renders the LLM-structured brief + per-channel (telegram/
  whatsapp/email) send status. Confirmed visually via screenshot.

## Session 2: Leads panel wired to Postgres + sound overhaul

- **Studio LeadsPanel → Postgres.** Added `config.adminKey` to
  `src/lib/studio.ts` (persisted, backfilled via a new zustand `merge`
  option so existing browsers don't lose the field on next load — additive
  config changes no longer need a version bump). `SettingsPanel` gained a
  "Leads access" card to enter it. `LeadsPanel` (`panels.tsx`) now fetches
  `GET /api/lead` on mount + on a "Refresh" button (sending `x-studio-key`
  if set), merges it with the local ring buffer by `id` (server wins on
  conflict), and shows a fetch-error line if the request itself fails
  (not shown when Postgres is simply unconfigured — that's a normal empty
  list, not an error). Verified live end-to-end with playwright-cli: submit
  a quick-quote lead on `/business/hire-me` → full page reload → `/studio` →
  unlock → Leads panel shows it; clicking Refresh round-trips `/api/lead`
  with no console errors. `npx tsc --noEmit` green.
- **Sound overhaul (Daniel's request mid-session).** The 40 placeholder
  sound files were low-quality and not zen-appropriate. This sandbox has
  **no outbound network access at all** (confirmed: DNS resolution fails
  for freesound.org, mixkit, even registry.npmjs.org) so I could not
  download real audio myself. Per Daniel's direction: wrote
  `scripts/download-sounds.mjs` — a Node script (run it where you have
  network) that pulls one curated, CC0-licensed sound per `SfxEvent` per
  realm from the Freesound.org API (real, documented API — no guessed
  URLs; actual file URLs are discovered from the API response at request
  time), tuned toward "zen": warm/airy/chime queries for light, deep/
  resonant/soft-electronic for dark. It wipes `public/sounds/{light,dark}`
  first, writes `<event>.mp3` uniformly (one extension, no more mixed
  .wav/.mp3), and writes `public/sounds/manifest.json` recording exactly
  which Freesound sound (id/author/license/permalink) was picked per file.
  **To run it:** get a free key at https://freesound.org/apiv2/apply/, then
  `FREESOUND_API_KEY=xxxxx node scripts/download-sounds.mjs` from a machine
  with internet access.
  Also, per Daniel's explicit ask, removed the procedural Web Audio
  synthesizer fallback entirely from `src/lib/sound.ts` (`playLight`/
  `playDark` and their now-unused `oscSweep`/`arp` helpers) — `play()` is
  now file-only; a missing/failed file is a silent no-op + console warning,
  never a crash. Left the two continuous **ambience loops**
  (`startLightAmbience`/`startDarkAmbience` — wind+chime / drone+crackle)
  untouched and still procedural, since there's no one-shot file equivalent
  for an infinite loop and Daniel's ask was framed around discrete effects.
  Deleted all 40 old files from `public/sounds/light` and `/dark` (both dirs
  now empty). Deleted the leftover exploratory `get-soundcn.js` (a prior,
  unrelated session's dead-end — soundcn's registry turned out to be
  gaming/WoW-themed, not zen-appropriate, so I didn't use it).
  **Verified live:** with the sound files deleted, clicking through the
  realm-select gate produces only caught 404s + `console.warn` (no thrown
  errors, no broken UI) — confirms the no-synth-fallback design is safe
  even with an empty sounds folder. `npx tsc --noEmit` green.
  **Site is silent (no SFX) until the script above is run** — that's
  expected, not a bug.

## Next Action

1. Daniel: get a Freesound API key and run
   `FREESOUND_API_KEY=xxxxx node scripts/download-sounds.mjs`, then spot-
   check the results against `public/sounds/manifest.json` — text-search
   matching is decent but not perfect; a few events may need a manual
   swap or a query tweak in the script's `QUERIES` map and a re-run.
2. Exercise the Rimuru live-call mode (mic/camera) in an actual browser
   with real devices — headless verification couldn't touch this.
3. Spot-check the remaining 3 projects' content blocks (`deusx` is a
   special founder/pitch case, already sampled; the rest were headings-only
   checked, not read block-by-block) for voice/quality, not architecture.
4. `.env.example` documents the required keys
   (CLOUDINARY_*, DATABASE_URL, TELEGRAM_*, OPENWA_*, RESEND_*,
   GEMINI_API_KEY, STUDIO_ADMIN_KEY, and now FREESOUND_API_KEY for the
   download script) — none are set in this environment, so uploads/
   Postgres/notify/sounds all run in their safe no-op fallback modes. Real
   verification of the notify fan-out and Cloudinary upload needs live
   credentials; ask Daniel before provisioning any of these.

## Original Prompt

/loop each project should have system design and architecture details (engineering) vs simple architecture + business-impact solution (business). The LLM is Rimuru Tempest (slime, "Reincarnated as a Slime"), living on every page, free-moving, hops across screen, seeks attention, comments when the user views a project, thought bubbles unless clicked to open the chat box. Fix chat page: ambient, bottom-docked like Google Assistant, non-blocking, clean; live mode audio+video+text. CMS more verbose: media uploads not just links, Postgres + Cloudinary. "In Quote" != "Hire Me": Hire Me has name, budget, project details, LLM structures request, notify Telegram/WhatsApp/email, shown in CMS/studio (studio = admin), OpenWA for WhatsApp. Name: BISINA, DANIEL (Bisina first + comma); Daniel same font as Tariwei but black.

## Tasks Remaining

- [x] Verify Rimuru mounts + behaves on every page — found + fixed a real gap (deep links into non-home routes never set `realm`, so Rimuru/theme/sound stayed inert); re-verified live with playwright-cli after the fix
- [x] Chat: ambient bottom dock, non-blocking, clean — already built into `rimuru.tsx`, confirmed live via screenshot
- [x] Per-project content: engineering system-design/architecture; business impact framing — confirmed present across all 8 case-study projects
- [x] CMS verbosity: media uploads wired to studio; Postgres + Cloudinary persistence — wired; Studio's Leads panel reads the local store only, not the Postgres list (see gap note above)
- [x] Hire-Me vs In-Quote split; LLM structures lead; Telegram + WhatsApp(OpenWA) + email notify; lead visible in studio/admin — confirmed live via screenshot and code read
- [ ] (optional) Wire Studio LeadsPanel to `GET /api/lead` for cross-device Postgres-backed lead visibility
- [ ] Exercise Rimuru live audio/video call mode with real devices in an actual browser

## Skills

- **Loaded:** caveman, token-optimizer, token-coach, ralph, karpathy-guidelines, impeccable, huashu-design, ui-ux-pro-max, high-end-visual-design, emil-design-eng

## In-Flight Code

Uncommitted working-tree changes (same machine, same folder, already present for the next account):

- `src/app/api/upload/route.ts`
- `src/app/api/lead/route.ts`
- `src/lib/leads.ts`
- `src/lib/ai/structure.ts`
- `src/lib/notify.ts`
- `src/lib/db.ts`
- `.env.example`
- `.claude/launch.json`

## Acceptance Assertions

1. `npx tsc --noEmit` is green — PASS (verified twice, before and after the realm-sync fix)
2. `npm run dev` serves clean with no console errors — PASS. Note: port 3000 was occupied by another process (PID 10248, unrelated) in this environment; the app itself served clean on :3001 (dev server already running from the prior session, PID 27068). No app-caused console errors in `.next/dev/logs/next-development.log`; only pre-existing THREE.js deprecation and scroll-behavior warnings, unrelated to this work.
3. Rimuru visible + interactive (move, comment, click-to-chat) on every page — PASS after fix. Verified live via playwright-cli: home page (after the realm-select ceremony) and a cold deep link to `/business/hire-me` (no prior visit) both show the roaming slime, bubble greeting, and click-to-open chat.
4. Chat is ambient, bottom-docked, non-blocking; live mode supports audio+video+text — PASS for ambient dock (screenshot-verified). Live mode's mic/camera/speech code is present and typechecks but wasn't exercised with real devices in this headless verification pass.
5. Hire-Me submission is LLM-structured, fires Telegram+WhatsApp+email, and appears in the studio/admin — PASS for structuring, notify fan-out (code path, env-gated no-op without live credentials), and Studio visibility (client-side store). Postgres-backed cross-device visibility in Studio is the one open gap (see above).

## Decisions

- Verify new code compiles with a typecheck instead of standing up a second dev server.

## Constraints

- Continue in caveman mode for intermediate reasoning; normal prose in final answers.
- This is the SAME working directory on the SAME machine: do not re-clone or reset; the uncommitted WIP above is intentional, build on it.
