# Portfolio Site — Vision & Spec Log

Owner: Daniel Tariwei Bisina. Brand name shown in the SVG signature/logo: **Tariwei**
(earlier draft of this doc had this wrong as "Terry Way" — a transcription slip from the
original dictated prompt; corrected 2026-07-09, verbatim section at the bottom is left
unedited as received).
Daniel's personal-use LLM preference (for his own work, not the site): Claude. Preferred
coding agent: Claude Code. The site's own AI assistant runs on Gemini as primary — see AI
assistant section below. Log started 2026-07-09.

This file exists so work can resume in any tool (Claude Code, Cursor, Gemini CLI, a fresh
session, whatever) without re-explaining the vision. Update it when scope changes. The raw
original request is preserved verbatim at the bottom.

## Current repo state

- Was a single static prototype: `Tariwei.dc.html` + `support.js`, dark theme, fonts already
  linked (Clash Display, Switzer, Instrument Serif, JetBrains Mono). Moved to `reference-old/`
  — kept for structural reference only. Daniel's own words: it "grabbed structural intention,
  not visual intention" — busy, generic, doesn't feel like him. Do not treat its visual choices
  (colors, font, layout density) as the target; the IA/flow it encodes is closer to right.
- No git repo existed at start. No framework existed at start.
- Next.js scaffolded into project root: Next 16.2.10, React 19.2.4, TypeScript, Tailwind v4,
  App Router, `src/`, package name `tariwei-portfolio`. Build verified clean.
- Next.js 16 ships its own bundled docs at `node_modules/next/dist/docs/01-app/` with a
  self-inserted `AGENTS.md` warning that App Router APIs/conventions may differ from training
  data — read the relevant doc page there before writing any App Router code (routing,
  layouts, metadata, etc.), don't assume Next 13-15 conventions still hold.
- No git repo initialized yet — still pending, recommended before real feature work starts.

## Core creative direction

Rounded, modern sans typeface. No text carousels anywhere on the site. No generic "AI slop"
look, no stock em-dash-riddled AI copy tone anywhere in site content. Every nav transition is a
real animated page transition, not a hard cut. Scroll-triggered animation on all text/sections,
site-wide, with **different** (not just scaled-down) behavior on mobile vs desktop. Responsive
down to a viewport narrower than an iPhone 4 / Galaxy Fold's outer screen.

Logo is SVG (the "Tariwei" signature). Wherever it appears — preloader, nav, footer — it runs
a continuous stroke-shimmer animation.

## Site flow

1. **Preloader** — animates the name (from the SVG) as an intro sequence. GSAP-grade
   character/word motion, not a spinner.
2. **Curtain-up reveal** into **"Choose Your Realm"** (light vs dark mood picker).
   - Two large cards, angled against each other (angle/cursor reference:
     https://www.cinetica.studio/ — copy the *style*, not colors: nothing sitting in the
     middle, no grid).
   - Dark card: scattering glass-shard effect. Light card: scattering dark-light/glass shard
     effect. Where the two scatter fields meet in the middle: a visible "rift" — the two
     effects colliding.
   - Both cards have a subtle idle "breathing" presence even at rest.
   - On hover, that card's realm becomes more prevalent — glass formation intensifies, and the
     card previews that mode's actual site presets live.
   - Choice sets site theme for the session (and should be remembered on return visits).
3. **About / Hero** (pacing + name treatment reference: https://mauriciojuba.com/) — warm,
   welcoming, first-person. No photo of Daniel — represent him some other way that blends into
   the site's visual language instead.
4. **Homepage brief-projects section** (reference: https://podium.global/ — specifically the
   "Deviate" and "80 Winters" cards) — short teaser cards into full case studies.
5. **Second immersive portal**, triggered by scrolling down — same angled-card language as step
   2, this time choosing **Engineer** vs **Business Owner**.
6. **Business path**:
   - Project **catalog** — grid-free. Reference https://k95.it/en for scroll-driven motion +
     sphere 3D rotation of project images (images come from the CMS per project). Reference
     https://www.cinetica.studio/ for cursor behavior and card angling. Must be switchable
     between a **rings** layout and a **spiral** layout.
   - Full **case-study page** per project (template reference:
     https://www.semlerpremium.dk/brands/lamborghini/aventador-798c407d-6f08-427b-b67b-f684c726bc92/)
     — hero explaining the project, then a live-demo link/embed to the actual site.
   - **Pitch Decks** — new nav entry, nested under Business, aimed at VCs. Same detail-page
     template as case studies (semlerpremium reference).
   - **"Hire Me"** (final name TBD — not "quotes") — visitor writes a detailed project brief.
     AI parses it, estimates a budget range, and states what's in/out of scope for that budget.
     The number is always a draft — Daniel reviews and authorizes the real figure before it's
     sent. The AI should remember a visitor's past quote conversation via cookie/IP session and
     resume it later.
7. **Engineering path**:
   - More technical tone — stack/build breakdown per project, architecture notes.
   - **Research** — new nav entry, under Engineering.
   - **Hackathons** — section under Engineering.
8. **Contact** — all contact info, presented as an immersive scene, not a plain list.
9. **Legal** — cookie-consent banner, GDPR-style Privacy Policy + Terms of Service.

## AI assistant — codename "Rimuru"

- Floating button, persistent site-wide, rendered as a slim 3D character.
- Primary model: Gemini. Built with a provider-agnostic tool-calling layer so swapping to
  Claude / DeepSeek / GPT is a config change, not a rewrite.
- Can: answer visitor questions, deep-link visitors to any page/section, explain any project in
  detail, take audio input, run a realtime "live" voice mode, call tools against the CMS/project
  data.
- Session memory keyed by cookie/IP: remembers in-progress "Hire Me" quotes, detects returning
  visitors ("welcome back" instead of a first-time greeting, restores their light/dark + audio
  choice).
- GitHub is a primary project source: Daniel connects his GitHub and the assistant/back end can
  pull repos in as case-study drafts. Also supports manual upload from Daniel's machine, or fully
  manual entry. The LLM turns whichever raw input into the structured case-study page.

## Audio system

Offered right after realm selection, independent of light/dark: **None / Zen / Classical**.
- Zen: ambient sound-design layer, sound effects synced to scroll/interaction events.
- Classical: subtle rotating classical piece in the background (e.g. Concierto de Aranjuez,
  Rodrigo — one of Daniel's favorites).
Visitor's choice should be a real, persisted preference, not a one-off toggle.

## Shortcuts

Keyboard shortcuts for: light/dark toggle, cycling audio mode, jumping to any nav section,
opening/closing the AI assistant.

## CMS / Admin Studio

A real internal tool, not just a settings page:
- Full control over fonts, type scale, animation curves/timings, scroll-animation behavior,
  text colors, global color tokens, every nav link, every footer item.
- Project intake three ways: GitHub auto-import (primary), manual file upload, manual form
  entry — AI turns any of these into a case-study draft.
- Visitor analytics: session/IP-grouped visit logs, heatmaps (click + scroll attention),
  returning-visitor detection feeding the "welcome back" personalization site-wide.

## Legal / compliance

Cookie consent banner, GDPR-compliant Privacy Policy and Terms of Service, written for a
personal site that runs analytics + an AI chat that stores conversation/session data.

## Hobbies / personality content (for About or a dedicated Hobbies section)

- Formula 1: fan of Max Verstappen, Red Bull.
- Football: Messi, Barcelona.
- Anime (general fan).
- Plays piano; favorite piece: Concierto de Aranjuez (Rodrigo).
- Driving/cars: BMW F90 M5 Competition, Porsche 911 GT3 RS, Koenigsegg Gemera, Bentley Flying
  Spur, Aston Martin Vantage.
- Personal-use LLM preference (hobby/own work, not the site's engine): Claude. Preferred
  coding agent: Claude Code.

## Inspiration references (what to extract from each)

| Site | Extract |
|---|---|
| https://k95.it/en | Catalog scroll motion + sphere 3D rotation of project imagery |
| https://www.cinetica.studio/ | Cursor behavior, angled-card composition, empty-middle/no-grid layout |
| https://www.noth.in/ | Preloader → reveal sequence; section scroll-scale/text animation |
| https://mauriciojuba.com/ | Name/hero treatment, about-page pacing without a headshot |
| https://podium.global/ | Homepage brief-project cards ("Deviate", "80 Winters") |
| https://www.semlerpremium.dk/brands/lamborghini/aventador-798c407d-6f08-427b-b67b-f684c726bc92/ | Case-study / pitch-deck detail page template |

General: pull additional animation/effect reference from Awwwards-tier Next.js sites, and
placeholder imagery from Unsplash.

## Explicit bans

No stock AI-generated visual cliches. No text carousels. No generic rounded-corner SaaS
look. No em dashes or AI-writing tics in any site copy.

## Assumptions made so far (flag if wrong)

- Stack: Next.js 15 App Router, TypeScript, Tailwind, GSAP/Framer Motion for 2D motion, React
  Three Fiber for the 3D catalog + glass-shard realm cards.
- Custom-built admin/CMS backed by a real database (Postgres via Prisma is the likely default),
  not a third-party headless CMS — required for analytics, heatmaps, session memory, and
  full-control editing.
- "Sphere 3D rotation" and the "rings vs spiral" toggle apply to the same catalog/project set —
  two layout modes for one dataset.
- Multi-LLM "portability" means one internal tool-calling abstraction with adapters per
  provider; the live default provider is Gemini, not a per-message runtime switch.

## Build order (proposed, not yet started beyond scaffold)

1. Foundation: Next.js scaffold, design tokens (type/color/motion), logo shimmer component.
2. Preloader → realm-select portal (the piece Daniel says looks wrong today — highest priority).
3. About/hero + homepage brief-project cards.
4. Second portal (Engineer vs Business) + both path shells.
5. Catalog (rings/spiral + 3D + cursor) + case-study/pitch-deck template.
6. Hire Me flow + Rimuru assistant (starts read-only/FAQ, then quoting, then GitHub intake).
7. Contact + legal pages + cookie consent.
8. CMS/admin studio + analytics/heatmaps.
9. Audio system (Zen/Classical) + shortcuts, layered in across all of the above.
10. Mobile-specific animation pass + smallest-viewport hardening.

---

## Original request, verbatim (for continuity)

so im building my porfolio websitre and while claude design has been able to grab my structural intewntion, its hasnt grasped my visual intention, The goal is to make the website as immersive as possible. Normally, it should start off by writing my name, Terry Way, which is provided in the SVG part, and it's probably in the HTML file. It animates that as a preloader for all the g-sub lentil motion and cruel animations on the website.

After preloading, the next step is for an immersive. After preloading, the curtain goes up and brings an immersive kind of realm where you have to pick between light, smooth, and dark mood. Right now it's so busy and doesn't look like myself. It's supposed to be like two cards angled against each other, light versus dark, maybe with a scattering glass effect for the dark board side and scattering dark lights effects like scattering glass effects for the light side. There will be a rift in the middle where the two scattering effects are colliding, and then there is a kind of presence to them both. They are both maybe breathing or something, but they are just two cards floating: "Choose your realm". As the mouse hovers over each round, that realm would be more prevalent, with the glass showing a glass kind of formation and stuff like that.  Next, after you, normally the cards that are showing will show the presets of the website in those realms. If it is light, it will show the light presets, just like it is right now. Once you go into light or dark mode, there should be a very welcoming about page about me. Because I don't want to add a photo of myself, it has to blend into the website properly. The hero section should be like an about telling me and stuff like that, and then, when you go down, another immersive portal. Note that the text on the website should all have scroll animation, so when you go down, it should show an immersive portal asking you to choose the realm again, just like it's doing right now, whether you want to go as an engineer or you want to go as a business owner.

Right now, the business owner page looks really nice, but I think it could use some more specialties, especially for when you try to enter the project. When you enter the project, you should have a full case presentation. It should be like a whole other website with the hero section explaining the project, then a link or a demo showing the live websites, which is a way for you to go to the live website. In the same thing, in the engineering realm, it should look more engineering focused, like, "Okay, these are the things used to build these," that are just very, very immersive. There should be cutting for all the nav links as well, so page transitions are very, very important. The website should be fluid and immersive. I don't like the font being used right now. I think I need a more rounded font that gives off a very modern vibe.

I also want you to use the cloud tool for viewing the web so that you can see what those websites look like and then pick some things. For catalog, I want to put in specific websites for catalog, and I want you to copy exactly what you see there, not the colors but the style. I want catalog to show all my projects, but to show images that I set in the CMS for the project. The images will be in a spiral section, with 3D kind of vibes, so as you're scrolling down, they are rolling downwards. I'll add the website for you to see what I'm talking about so that you can make it as perfect as that.

You have the quotes. Let's not even call it quotes. Let's call it something else, maybe "Hire Me" or something. I don't know what you want to go figure out the best thing to call it on that page. They should be able to give us a detailed explanation of what they want the projects to be. The AI that I'll have in my portfolio will be able to analyze it and then they can say what they want to do, what they do, and how much they have here. I cannot analyze it, see it, and then determine how much it should cost, but it would say the estimated budget is this. The final budget would be reviewed and would be authorized by me, obviously, so it can give you kind of quotes and tell them what we can do with their budget and what is out of scope with their budget.

The contact me page has all my contact information, but in a very, very immersive way. I'm going to give you some portfolio websites I want you to use. That award is an AWWW website, so I want you to get most of your things from there. I need you to be able to see what the websites are like, because most of their next.js websites are mostly, maybe, from the bundled stuff. You'll be able to get the code, so I need you to be able to see different websites for various animations and effects. I need you to also get all the images you can get, any image at all, all these get templates and placeholder images from what's it called on splash.

thi sis the websitte for thew catalogue https://k95.it/en i want both the scroll and sphere 3d roataion then the cursor as well but let the m be angeld like this one exactly ilek ihtiis https://www.cinetica.studio/ nothing on the misdlle , no grid nonnonesen but we should be able to switrtcfh bewttwenn rings and spiral like the other one

then for revael after [prelloading use https://www.noth.in/  aslo use oif t for section scroll animations, love how it scales sections and the texts so nicve

get inspo from here for nmy aboiut and name https://mauriciojuba.com/  my name is Daniel Tariwei Bisina

can add ythis scetion with the deviate and 80 wintewrs card from https://podium.global/ to my homepage where they can see brief projects of mine

use these for detaoiked presentation pages of the business side https://www.semlerpremium.dk/brands/lamborghini/aventador-798c407d-6f08-427b-b67b-f684c726bc92/

i nee dyou to add two more pages, pitch decks and reseafdrch , so pitch deck will be under for VCss., but it will be a navlink under the for nbusiness when yougpo to the nav bar

iuse this for pictch cks https://www.semlerpremium.dk/brands/lamborghini/aventador-798c407d-6f08-427b-b67b-f684c726bc92/

the research will be in for engineers , so make sure to add tehm in the portals explalnation

then ni want the website to either make use of sound effects or maybe just play classical music but i want it to be up to the visiot, so when they select either light or dark mode tehy can select btwn no audio, zen, classical , where zen would be a sound effects barragewof xen monde, where the scroll effects have sound effdects toi match and there san ambiance. while clasdsdical , will pay a subtle classical music of tyhe day thoerugh out the webnsire

i want you to aslo buoild; teh cms for this websuite

an advanced amin panel where i manbage every singlke thing

font, typography, type animation, scroll anmimations, text color, general colors, everythsingle detaisl, evetylink every item in footer, nave evrythinh

note that the logo is svg and it should ahave a stroike shimmer animmation continuously  at anywhere it appearfs,

the cms should also be inetgrated with ai to manage everything and make it easirert fo me to change multiple things as=t once, the whole website should be deeply embedded with llmsthat can interaact with visitors visitors cann ask quastions, it can redircft them to where they want to go , answe questions on any projects and more. so for that i will also connect my gitrhub to the webiste, my guitrhub will be one of the primary points of pickuing projects, i can alsio pick from my pc or add manual;ly, the llm will make snet of it abnd pbuild theporfolioi for taht project on teh website

so the ai should havbe a floating ai button , its hould be maybe a 3d slim called rimuru

also make sure the moblile verison of the sire is jkust as amazing, in respoinsive ness tailor scroioll and effeects to mobile so the scroll animations can be doifferent on mobile and on desktop, make sure the websiter is resposnsice uip to the smalledst possible viewport even slimmer that the glalxy fold serises outer screen,. smaller than iphone 4 screen

befoore i forget lso add hackatrhonsd top the engineering sections

allprojhect can wither have a video and or a live demo and or an imahge and or the embedded live site

note that the website ahousl LLOW the use of shoprtcuts, shorcuts to switch between dark and lihght mode, also between Aaudsdiqoi modes, shortcut to sacess each navlink or to ascccess teh llm

thje cms should be a whole studio and should have a log for the visiotors and heatmap0s afrom where they looled and sec;e4lted maybe grouped by sessionor bny oips adderesses and if someone who ahas come before comes bacjk it sshould remeber therie prefernce and instead of just saying welkcome bfefir enteringit says welcome back

so make sure to tell tehm to accepospt cooksires nd studd alo add a goocompliant terms and service as well as privacy policy

make thisd website teh bomb, no stupid ai looking slops, no text carousels, i hate that shoit ,. . loveluy rounfd modern ffonst none of gat claude shit

the llm is primaritylkyt gemini, butv build for easy porting between gemein, claude, deepsekk, and gopt

make the llms tool calling supervb, add audio inopputs, add live modfe for the llm

let the llm remember the [projects users have quoted pers uses coiokie sessionor ipaddress, so it can continue the conversation where ever also add a hobies section, i love Formula ! fv driver max,k tem redbulls, footlbal;l, fav player Messi, team barca, love watchiung anime, play musicla instrumenst, fave piano, love music fav rn is Concerto de aranjuez by roidgrigo , i love driving , my fav v cars are bmw f90 m5 comp, porsche gt3rs, konisegg gemera, bentley flying spuer, aston nmartin vantage, prefereed llm is claude, and pre4ffered coding agent is claude code

make teh welcom just like the animation used for nnothing here after the preloader https://www.noth.in/
