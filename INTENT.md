# INTENT LOG — Tariwei Portfolio

Purpose: durable log of Daniel's full design intent so any session (or any agent) can
continue exactly where the last one stopped. Update the STATUS section whenever work lands.

Last updated: 2026-07-09 (session ce619179, branch `worktree-fracture-realm-select`)

---

## STATUS

Done (committed on master):
- Preloader (name animation), design foundation, logo SVG
- Realm-select FRACTURE port + audio pick (merged from worktree branch, ff to master)
- Fonts fully swapped: Unbounded (display) + Space Grotesk (body) via next/font,
  Fontshare links removed, globals.css tokens updated
- About/Hero, homepage featured-project cards
- Second portal (Engineer vs Business) + path shells
- Catalog v1 at /business/catalog: rings/spiral toggle, scroll rotation, tilted cards,
  custom cursor. Functional but NOT yet matched against k95.it/cinetica.studio live —
  Chrome extension was disconnected (Chrome auto-updated); visual fidelity pass pending.

From the fracture-branch session (already merged; kept for context):
- Realm-select v2: exact port of `theme-select.html` (FRACTURE design) — Daniel supplied
  this file as THE reference for how theme selection must look. Angled holographic
  cards ±22°, WebGL split-environment background with glass-shatter seam + lightning,
  mini UI preview inside each card, cursor group tilt, seam sweeps away on choose.
- Audio mode pick (Silence / Zen / Classical) folded into the post-choice screen.
- Fonts: Unbounded + Space Grotesk added (Daniel dislikes current fonts, wants rounded
  modern, approved the look of theme-select.html).
- Fixes on top of the reference (found by multi-agent review): seam sweep direction was
  inverted in the reference HTML itself (choosing light swept the background dark) — sign
  flipped in the shader; enter-CTA span given block layout; inert + focus management for
  the two stages; 550ms click gate so a double-click cannot skip the audio screen;
  WebGL-less fallback background; mobile scroll escape for stacked cards.
- Known polish gap (deliberate, belongs to roadmap item 21): entering the site after the
  audio pick is an instant unmount, no exit crossfade yet. Solve together with the
  site-wide page-transition system.

Uncommitted in main checkout (from an earlier session, do not lose):
- `src/components/catalog.tsx` + `src/app/business/catalog/page.tsx` (3D catalog, untested)
- `theme-select.html` (the reference file)

## ROADMAP (from Daniel's full prompt, 2026-07-09)

1. Preloader: animate name "Daniel Tariwei Bisina" SVG, gsap; curtain-up reveal after,
   exactly like https://www.noth.in/ reveal. Use noth.in for section scroll/scale animations too.
2. Realm select: theme-select.html design (this branch).
3. About/hero: inspo https://mauriciojuba.com/ — welcoming, no photo, blends in.
   All text scroll-animated.
4. Homepage: add brief-projects section like the deviate + 80 winters cards on https://podium.global/
5. Second portal (Engineer vs Business) — exists; portals' copy must mention:
   Engineer realm gets Research + Hackathons sections; Business gets Pitch Decks.
6. Catalog (/business/catalog): reference https://k95.it/en (scroll + sphere 3D rotation + cursor)
   but cards ANGLED like https://www.cinetica.studio/ — nothing in middle, no grid.
   Switchable rings/spiral modes. Images come from CMS per project.
7. Business project pages: full case presentation like
   https://www.semlerpremium.dk/brands/lamborghini/aventador-798c407d-6f08-427b-b67b-f684c726bc92/
   Hero explaining project, live demo link/embed. Same ref for Pitch Decks pages.
8. Engineer project pages: engineering-focused (stack, how it was built), immersive.
9. New pages: Pitch Decks (navlink under Business), Research (under Engineer).
10. "Hire Me" (renamed from Quotes): client describes project, AI analyzes, estimates
    budget ("final budget reviewed and authorized by Daniel"), says what fits their budget.
11. Contact page: all contact info, immersive.
12. Audio: visitor picks at realm select — none / zen (scroll-matched SFX + ambiance) /
    classical (subtle classical music of the day; Daniel's fav: Concierto de Aranjuez, Rodrigo).
13. CMS "studio": admin panel managing EVERYTHING (fonts, typography, type/scroll animations,
    colors, footer/nav items, every link). AI-integrated (bulk changes via LLM).
    Visitor logs, heatmaps grouped by session/IP, returning visitor → "Welcome back".
14. Site-wide LLM: floating 3D slime button named "Rimuru". Answers questions, redirects,
    knows all projects. GitHub integration = primary project source (also PC upload/manual);
    LLM builds the project portfolio page from repo. Primary LLM Gemini, port-ready for
    Claude/DeepSeek/GPT. Superb tool calling, audio input, live mode. Remembers quoted
    projects per cookie-session/IP, resumes conversations.
15. Keyboard shortcuts: theme toggle, audio modes, each navlink, open LLM.
16. Cookie consent + compliant Terms of Service + Privacy Policy.
17. Hobbies section: F1 (Max Verstappen, Red Bull), football (Messi, Barça), anime,
    piano, music (fav: Concierto de Aranjuez), driving (BMW F90 M5 Comp, Porsche GT3 RS,
    Koenigsegg Gemera, Bentley Flying Spur, Aston Martin Vantage). Preferred LLM: Claude;
    preferred coding agent: Claude Code.
18. Projects: each can have video and/or live demo and/or image and/or embedded live site.
19. Logo: SVG with continuous stroke shimmer animation everywhere it appears.
20. Mobile: responsive to smaller than Galaxy Fold outer screen / iPhone 4; scroll
    animations tailored differently for mobile vs desktop.
21. Page transitions on all nav links — fluid, immersive. Curtain cuts.
22. Taste rules: NO text carousels, NO AI-slop copy or fonts, no em-dashes/AI writing tells,
    rounded modern fonts, Awwwards-tier bar. Placeholder images from Unsplash.

## REFERENCE SITES

- https://www.noth.in/ — post-preloader reveal + section scroll/scale animations
- https://k95.it/en — catalog scroll + sphere 3D rotation + cursor
- https://www.cinetica.studio/ — catalog card angling, minimal middle
- https://mauriciojuba.com/ — about/name presentation
- https://podium.global/ — homepage brief-projects cards (deviate / 80 winters)
- https://www.semlerpremium.dk/brands/lamborghini/aventador-798c407d-6f08-427b-b67b-f684c726bc92/ — business case pages + pitch decks

## FULL ORIGINAL PROMPT (2026-07-09, verbatim)

> now i just added theme-select html aas an example of what i bwant the select theme to look like,m so replace the currnet onme with that but with thge sameso heres my initial prompt soinnet is not gfetting it right soi use your sense to fix all the ui to mayc h my desire /caveman/compress /impeccable /design-spells /design-taste-frontend /design-motion-principles /huashu-design /karpathy-guidelines /ralph /steve-jobs /antigravity-design-expert /nextjs-best-practices /nextjs-app-router-patterns /react-nextjs-development /senior-architect /senior-frontend /threejs-skills
>
> so im building my porfolio websitre and while claude design has been able to grab my structural intewntion, its hasnt grasped my visual intention, The goal is to make the website as immersive as possible. Normally, it should start off by writing my name, Terry Way, which is provided in the SVG part, and it's probably in the HTML file. It animates that as a preloader for all the g-sub lentil motion and cruel animations on the website.
>
> After preloading, the next step is for an immersive. After preloading, the curtain goes up and brings an immersive kind of realm where you have to pick between light, smooth, and dark mood. Right now it's so busy and doesn't look like myself. It's supposed to be like two cards angled against each other, light versus dark, maybe with a scattering glass effect for the dark board side and scattering dark lights effects like scattering glass effects for the light side. There will be a rift in the middle where the two scattering effects are colliding, and then there is a kind of presence to them both. They are both maybe breathing or something, but they are just two cards floating: "Choose your realm". As the mouse hovers over each round, that realm would be more prevalent, with the glass showing a glass kind of formation and stuff like that.  Next, after you, normally the cards that are showing will show the presets of the website in those realms. If it is light, it will show the light presets, just like it is right now. Once you go into light or dark mode, there should be a very welcoming about page about me. Because I don't want to add a photo of myself, it has to blend into the website properly. The hero section should be like an about telling me and stuff like that, and then, when you go down, another immersive portal. Note that the text on the website should all have scroll animation, so when you go down, it should show an immersive portal asking you to choose the realm again, just like it's doing right now, whether you want to go as an engineer or you want to go as a business owner.
>
> Right now, the business owner page looks really nice, but I think it could use some more specialties, especially for when you try to enter the project. When you enter the project, you should have a full case presentation. It should be like a whole other website with the hero section explaining the project, then a link or a demo showing the live websites, which is a way for you to go to the live website. In the same thing, in the engineering realm, it should look more engineering focused, like, "Okay, these are the things used to build these," that are just very, very immersive. There should be cutting for all the nav links as well, so page transitions are very, very important. The website should be fluid and immersive. I don't like the font being used right now. I think I need a more rounded font that gives off a very modern vibe.
>
> I also want you to use the cloud tool for viewing the web so that you can see what those websites look like and then pick some things. For catalog, I want to put in specific websites for catalog, and I want you to copy exactly what you see there, not the colors but the style. I want catalog to show all my projects, but to show images that I set in the CMS for the project. The images will be in a spiral section, with 3D kind of vibes, so as you're scrolling down, they are rolling downwards. I'll add the website for you to see what I'm talking about so that you can make it as perfect as that.
>
> You have the quotes. Let's not even call it quotes. Let's call it something else, maybe "Hire Me" or something. I don't know what you want to go figure out the best thing to call it on that page. They should be able to give us a detailed explanation of what they want the projects to be. The AI that I'll have in my portfolio will be able to analyze it and then they can say what they want to do, what they do, and how much they have here. I cannot analyze it, see it, and then determine how much it should cost, but it would say the estimated budget is this. The final budget would be reviewed and would be authorized by me, obviously, so it can give you kind of quotes and tell them what we can do with their budget and what is out of scope with their budget.
>
> The contact me page has all my contact information, but in a very, very immersive way. I'm going to give you some portfolio websites I want you to use. That award is an AWWW website, so I want you to get most of your things from there. I need you to be able to see what the websites are like, because most of their next.js websites are mostly, maybe, from the bundled stuff. You'll be able to get the code, so I need you to be able to see different websites for various animations and effects. I need you to also get all the images you can get, any image at all, all these get templates and placeholder images from what's it called on splash.
>
> thi sis the websitte for thew catalogue https://k95.it/en i want both the scroll and sphere 3d roataion then the cursor as well but let the m be angeld like this one exactly ilek ihtiis https://www.cinetica.studio/ nothing on the misdlle , no grid nonnonesen but we should be able to switrtcfh bewttwenn rings and spiral like the other one
>
> then for revael after [prelloading use https://www.noth.in/  aslo use oif t for section scroll animations, love how it scales sections and the texts so nicve
>
> get inspo from here for nmy aboiut and name https://mauriciojuba.com/  my name is Daniel Tariwei Bisina
>
> can add ythis scetion with the deviate and 80 wintewrs card from https://podium.global/ to my homepage where they can see brief projects of mine
>
> use these for detaoiked presentation pages of the business side https://www.semlerpremium.dk/brands/lamborghini/aventador-798c407d-6f08-427b-b67b-f684c726bc92/
>
> i nee dyou to add two more pages, pitch decks and reseafdrch , so pitch deck will be under for VCss., but it will be a navlink under the for nbusiness when yougpo to the nav bar
>
> iuse this for pictch cks https://www.semlerpremium.dk/brands/lamborghini/aventador-798c407d-6f08-427b-b67b-f684c726bc92/
>
> the research will be in for engineers , so make sure to add tehm in the portals explalnation
>
> then ni want the website to either make use of sound effects or maybe just play classical music but i want it to be up to the visiot, so when they select either light or dark mode tehy can select btwn no audio, zen, classical  , where zen would be a sound effects barragewof xen monde, where the scroll effects have sound effdects toi match and there san ambiance. while clasdsdical , will pay a subtle classical music of tyhe day thoerugh out the webnsire
>
> i want you to aslo buoild; teh cms for this websuite
>
> an advanced amin panel where i manbage every singlke thing
>
> font, typography, type animation, scroll anmimations, text color, general colors, everythsingle detaisl, evetylink every item in footer, nave evrythinh
>
> note that the logo is svg and it should ahave a stroike shimmer animmation continuously  at anywhere it appearfs,
>
> the cms should also be inetgrated with ai to manage everything and make it easirert fo me to change multiple things as=t once, the whole website should be deeply embedded with llmsthat can interaact with visitors visitors cann ask quastions, it can redircft them to where they want to go , answe questions on any projects and more. so for that i will also connect my gitrhub to the webiste, my guitrhub will be one of the primary points of pickuing projects, i can alsio pick from my pc or add manual;ly, the llm will make snet of it abnd pbuild theporfolioi for taht project on teh website
>
> so the ai should havbe a floating ai button , its hould be maybe a 3d slim called rimuru
>
> also make sure the moblile verison of the sire is jkust as amazing, in respoinsive ness tailor scroioll and effeects to mobile so the scroll animations can be doifferent on mobile and on desktop, make sure the websiter is resposnsice uip to the smalledst possible viewport even slimmer that the glalxy fold serises outer screen,. smaller than iphone 4 screen
>
> befoore i forget lso add hackatrhonsd top the engineering sections
>
> allprojhect can wither have a video and or a live demo and or an imahge and or the embedded live site
>
> note that the website ahousl LLOW the use of shoprtcuts, shorcuts to switch between dark and lihght mode, also between Aaudsdiqoi modes, shortcut to sacess each navlink or to ascccess teh llm
>
> thje cms should be a whole studio and should have a log for the visiotors and heatmap0s afrom where they looled and sec;e4lted maybe grouped by sessionor bny oips adderesses and if someone who ahas come before comes bacjk it sshould remeber therie prefernce and instead of just saying welkcome bfefir enteringit says welcome back
>
> so make sure to tell tehm to accepospt cooksires nd studd alo add a goocompliant terms and service as well as privacy policy
>
> make thisd website teh bomb, no stupid ai looking slops, no text carousels, i hate that shoit ,. . loveluy rounfd modern ffonst none of gat claude shit
>
> the llm is primaritylkyt gemini, butv build for easy porting between gemein, claude, deepsekk, and gopt
>
> make the llms tool calling superb, add audio inopputs, add live modfe for the llm
>
> let the llm remember the [projects users have quoted pers uses coiokie sessionor ipaddress, so it can continue the conversation where ever also add a hobies section, i love Formula ! fv driver max,k tem redbulls, footlbal;l, fav player Messi, team barca, love watchiung anime, play musicla instrumenst, fave piano, love music fav rn is Concerto de aranjuez by roidgrigo , i love driving , my fav v cars are bmw f90 m5 comp, porsche gt3rs, konisegg gemera, bentley flying spuer, aston nmartin vantage, prefereed llm is claude, and pre4ffered coding agent is claude code
>
> make teh welcom just like the animation used for nnothing here after the preloader https://www.noth.in/
>
> /avoid-ai-writing  no use of emdashes or ai writing sybools
>
> /dispatching-parallel-agents /workflows /using-superpowers
>
> refer top globsl claude.md and agenbts.md for dev preferences
>
> make sure to log all intent so i can continue somehwere else in case you run out of usage, log the whole of this prompt aslo
