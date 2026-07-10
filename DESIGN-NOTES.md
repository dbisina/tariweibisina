# Design notes — observed live in Chrome, 2026-07-09

First-hand observations of all six reference sites, viewed and scrolled live.
These override any earlier text-only research guesses. Extract the *style*, never the colors.

## k95.it/en — catalog (rings + spiral)

- Camera sits INSIDE a sphere of floating project cards. Rings mode: cards on horizontal
  bands of the sphere (upper/middle/lower arcs visible at once). Scroll rotates the whole
  sphere vertically past the camera; rotation has inertia, keeps drifting after scroll stops.
- Cards are CURVED planes (bent to the sphere surface, cylindrical bend), not flat quads.
  Side cards foreshorten to slivers. All cards duotone-tinted toward the bg color; the card
  nearest center-focus scales up large and regains FULL color (tint fades to 0).
- Spiral mode: same cards reflow into a vertical helix; scrolling rolls them downward around
  the axis. Mode toggle = small pill (RINGS | SPIRAL) top-center, active side highlighted.
  Rings→spiral transition is a smooth per-card morph (~1s), not a cut.
- Cursor: pill that reads "SCROLL" with a yellow-green dot by default; on card hover becomes
  a translucent circle + a separate floating chip next to it: project name + category
  ("Nino Martoglio / Branding") with an arrow glyph.
- Center of the sphere holds a chrome/metallic pixelated sculpture that morphs per scroll
  position. DANIEL EXPLICITLY DOES NOT WANT THIS, nor the faint grid overlay on the bg —
  his center stays EMPTY (cinetica-style negative space).
- Bottom-center counter: "12 / 20 selected Works". Bottom-left studio label, top-right nav.

## cinetica.studio — angling, cursor, HUD, section language

- Hero: giant condensed uppercase split placement (top-left phrase / bottom-right phrase),
  floating 3D cubes, central light glow. HUD chrome everywhere: timestamp, vertical
  "LOADING NEW REALITY...", barcode, tick ruler along left edge, corner brackets around nav
  items on hover. Intro paragraph renders with scrambled/decrypting glyphs that resolve.
- Section transitions: starfield hyperspace warp; bg inverts black→white→black across page.
- Headlines BEND: text enters arced/warped along a curve, settles straight.
- Word-by-word scroll reveal for paragraphs (words fade/slide in sequentially with scrub).
- Floating photo cards rain from top edges TILTED at varied angles (~8-20deg), scattered
  left/right, CENTER KEPT EMPTY. This is the "angled, nothing in the middle" language.
- Stat circles: number inside a hand-drawn ellipse stroke + label below (+120 PROJECTS,
  5B VIEWS, +1M USERS), sparkle glyph decorations.
- Giant horizontal marquee statement driven by scroll, tail letters tumble/rotate
  individually as they catch up.

## noth.in — preloader, reveal, scroll-scale

- Preloader: black bg, giant "N'" centered; BETWEEN the letters a B&W 3D object cycles
  (crumpled foil smiley, bubble-wrap heart...). Counter counts DOWN 100→0 bottom-center.
- THE REVEAL: preloader is the hero seed. At 0 the black lifts and the "N'" EXPANDS into
  the full word "NOTHIN'" filling the viewport edge-to-edge, colors invert to white/black.
  For tariwei: preloader signature draw-in morphs/expands into the hero wordmark position.
- Hero: full-bleed wordmark, tagline top-left, one pill CTA (BOOK A CALL →), MENU top-right,
  footer strip (location left, socials right). Tiny "N'" persists top-left after scroll.
- Scroll: giant two-line statements with huge whitespace ("Most brands produce content. /
  We prefer ideas."). Media bands: full-width panels where the preloader's 3D objects
  reappear (continuity). Showcase images enter OFFSET (partial width, from right) small,
  then grow/settle as you scroll — the scale-on-enter Daniel loves.
- WORKS: bg inverts to black; project cards alternate left/right at partial width, eyebrow
  (client) + one-line tagline; statement text sits in the empty opposite column.

## podium.global — featured work cards

- Hero: white, logo glyph masked with video reels, tagline bottom-left, SCROLL DOWN
  bottom-right. Then bg flips to black.
- Cards fly in with a fabric/flag WARP (surface bends during motion, settles flat).
- Work grid: staggered masonry on black, mixed sizes/orientations, video thumbnails.
  Title BELOW media, bold condensed uppercase; year + client right-aligned small.
  (DEVIATE/2025/PUMA, 80 WINTERS/2025/AUCLAIR, WESTERN STATES/2025/SALOMON...)
- Offscreen/inactive card titles dim to gray; active are white.
- "LIST VIEW" toggle floating bottom-center with corner brackets.

## mauriciojuba.com — hero/about, HUD, stacked work deck

- Hero: eyebrow role line top-left ("STAFF DESIGN ENGINEER" + specialties), name split in
  two treatments: "MAURICIO" light/outline off-white, "JUBA." heavy solid in accent mint.
  Status chips row under name (■ 10+ YEARS SHIPPING SYSTEMS ■ BASED IN SÃO PAULO ■ OPEN TO
  GLOBAL RELOCATION). Right half: DITHERED/halftone pixel portrait (for Daniel: apply the
  dither treatment to an abstract object or the signature, not a photo).
- Persistent HUD bottom bar: "SCRL 0.00  CRSR 0.0" left, "00 — INTRO" section indicator
  center (updates per section), "THEME ■ #C3FFFC" + live clock right.
- Nav numbered: 01/WORK 02/ARTICLES 03/LAB 04/ABOUT 05/CONTACT; active gets ( brackets );
  GET IN TOUCH accent pill right. Awwwards nominee tab on right edge.
- FEATURED WORK: giant scroll-linked horizontal marquee title, alternating OUTLINED and
  SOLID-accent words.
- Projects: STACKED DECK — each card slides up OVER the previous (previous dims/blurs
  underneath). Card = left text panel (italic category+year, big accent title, description,
  stat number row like "4 / ALL / JSON+CSS") + right visual panel. "4 PROJECTS" counter.

## semlerpremium.dk Aventador — case-study / pitch-deck template

- Hero: full-bleed dark studio photo; a brighter portrait-crop "window" panel centered over
  it; brand eyebrow (LAMBORGHINI) small; giant thin extended uppercase title (AVENTADOR)
  overlaid; SCROLL hint bottom-left.
- KILLER FEATURE — persistent sticky bottom stats pill through the WHOLE page: 4 key
  numbers (127.489 kr./md. | 755.250 kr./udb. | 60 km | København) + scroll-top arrow.
  Persistent KONTAKT pill bottom-right. Case-study mapping: stack/uptime/timeline/status.
  Pitch-deck mapping: ARR/users/raise/stage. CTA = "View live site".
- Sections: label left (BESKRIVELSE AF BILEN), body right, slow fade-in, enormous dark
  breathing room between sections.
- Gallery: horizontal carousel, arrow buttons + thin progress line, rounded corners.
- INFORMATION: three-column label/value spec tables (BILDATA | PRISER) with hairline
  dividers; pill tab toggle (Ekskl./Inkl. moms) → maps to stack-vs-metrics toggles.
- VÆRDIFULD VIDEN: one dramatic scarcity line ("1 ud af 250 biler produceret...").
- Full-bleed atmospheric media breaks (curtain bg + portrait media panel) between sections.

## Cross-site synthesis for tariwei

1. Preloader→hero morph (noth.in) using the signature SVG; countdown DOWN not up.
2. Catalog = k95 sphere/rings/spiral geometry + curved tinted cards + focus-color reveal
   + name-chip cursor, MINUS center sculpture and grid; empty center per cinetica.
3. Featured work (home) = podium masonry: title below media, year+client right, dim
   inactive titles.
4. Engineer project pages = juba stacked deck with stat rows; Business case pages =
   semler template with sticky stats bar + persistent CTA.
5. HUD identity layer everywhere (juba/cinetica): scroll/cursor readout, section indicator,
   theme hex, live clock, corner brackets, scramble-in labels.
6. Scroll grammar: statements huge with whitespace, media enters offset-small then grows,
   word-by-word paragraph reveals, occasional bg inversion; text can bend on entry.

## k95 catalog — decoded from their shipped bundle (reference-bundles/k95/__nuxt_BPcg-sbR.js)

Component is literally named ThreeCylinderScene with a `spiral: Boolean` prop (blend factor
J tweens 0..1). Camera sits OUTSIDE the cylinder looking at it (not inside as guessed):
desktop fov 50, cameraZ 13, radius 7.8, panels 1.54x2.09 world units, rowSpacing 7.
Mobile (<500px): fov 70, cameraZ 7.5, radius 4.5. 12 panels per row x 5 rows, textures
repeat when fewer projects. Per-row half-step angle offset: angle = (i + row*0.5)/12 * 2pi.
Spiral y-shift per panel: (i/12 - 0.5) * rowSpacing blended in by J.

Cards are shader panels (PlaneGeometry 12x8 segments), NOT bent geometry. Vertex shader:
parabolic arch pos.z -= (1-xn^2)*uBendH + (1-yn^2)*uBendV where uBendH/V are driven by spin
and scroll VELOCITY (bend factors 0.008/0.007) — cards flex while moving, flatten at rest.
Idle wave: pos.z += sin(uv.y*6.283 + t*0.55 + phase) * sin(uv.x*3.14 + t*0.35 + phase*1.3)
* 0.016, phase random per panel. Fragment: 9-tap box blur for entrance (uBlur 0.15->0),
depth tint: t = smoothstep(cameraZ*0.58, cameraZ*1.85, viewZ); desaturate 12% toward luma
then mix toward bg color by t*strength; opacity fade separate.

Input: wheel rotation target -= deltaY*0.005; velocity kick L += deltaY*0.004 clamped [-2,2]
decaying after 200ms idle -> drives the bend uniforms. Rings<->spiral morph: eased lerp of
position+quaternion+scale over 1.2s (to spiral) / 0.85s (back), plus z-arc toward camera
sin(j*pi*0.9)*0.22 mid-morph. Focus scales ~1.26, dim 0.88, base 0.72 (constants Yo/Xo/qo).
Raycast click only when focused. Smooth scroll is Lenis (exp damp class in CKNV_Ulo.js).
