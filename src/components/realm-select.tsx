"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSiteStore, type AudioMode } from "@/lib/store";
import { Logo } from "@/components/logo";
import styles from "./realm-select.module.css";

/**
 * "Choose Your Realm" portal — direct port of the approved theme-select.html
 * (FRACTURE) reference design:
 *  - Raw WebGL fullscreen shader: split light/dark environment with a slanted
 *    seam, voronoi glass-shatter band where the two worlds collide, lightning
 *    bolts flickering along the rift, mouse-following light.
 *  - Two floating holographic cards angled toward each other (±22°), each with
 *    an animated holo border, sheen sweep, and a mini preview of the site in
 *    that realm.
 *  - Choosing a realm sweeps the seam off-screen, then asks for the audio
 *    mode (silence / zen / classical) before entering the site.
 */

type Side = "light" | "dark";

const VERT = `
attribute vec2 aPos;
void main(){ gl_Position = vec4(aPos,0.,1.); }
`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uBlend;   // 0.5 = split, 0 = all light, 1 = all dark

float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
vec2 hash2(vec2 p){
  return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
}
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
             mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
}
float fbm(vec2 p){
  float v=0., a=.5;
  for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.03; a*=.5; }
  return v;
}

/* voronoi returning edge distance + cell id */
vec3 voronoi(vec2 p){
  vec2 n=floor(p), f=fract(p);
  vec2 mg, mr;
  float md=8.;
  for(int j=-1;j<=1;j++)
  for(int i=-1;i<=1;i++){
    vec2 g=vec2(float(i),float(j));
    vec2 o=hash2(n+g);
    vec2 r=g+o-f;
    float d=dot(r,r);
    if(d<md){ md=d; mr=r; mg=g; }
  }
  md=8.;
  for(int j=-2;j<=2;j++)
  for(int i=-2;i<=2;i++){
    vec2 g=mg+vec2(float(i),float(j));
    vec2 o=hash2(n+g);
    vec2 r=g+o-f;
    if(dot(mr-r,mr-r)>.00001)
      md=min(md, dot(.5*(mr+r), normalize(r-mr)));
  }
  return vec3(md, hash2(n+mg));
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x/uRes.y;
  vec2 p = vec2(uv.x*aspect, uv.y);
  float t = uTime;

  /* ---- convergent slanted seam ---- */
  float slant = 0.42;
  float seamX = 0.5*aspect + slant*(uv.y-0.5)*aspect*0.6;
  /* blend override sweeps seam off-screen when a theme is chosen.
     Sign flipped vs the reference HTML, whose sweep was inverted:
     light needs the seam pushed right (all pixels on the light side). */
  seamX -= (uBlend-0.5)*2.4*aspect;

  /* ambient environment warp */
  float warp = fbm(p*2.2 + t*0.06)*0.05;
  float side = p.x - seamX + warp;   /* <0 light, >0 dark */

  /* ---- glass shatter band around the seam ---- */
  float band = exp(-abs(side)*7.0);          /* 1 at seam, falls off */
  vec3 vor = voronoi(p*9.0 + vec2(0., t*0.05));
  float cracks = 1.0 - smoothstep(0.0, 0.05, vor.x);   /* thin crack lines */

  /* shards refract: offset the side test per-cell so pieces of each
     world break across the boundary */
  float shardShift = (vor.y-0.5)*0.22*band + (vor.z-0.5)*0.1*band;
  float sideShifted = side + shardShift;

  float mixDark = smoothstep(-0.006, 0.006, sideShifted);

  /* ---- base environments ---- */
  vec3 lightEnv = vec3(0.965,0.960,0.950);
  lightEnv -= fbm(p*3.0 - t*0.04)*0.05;                 /* soft grain */
  lightEnv -= exp(-abs(side)*3.5)*0.10;                 /* shadow toward seam */

  vec3 darkEnv = vec3(0.030,0.032,0.048);
  darkEnv += fbm(p*3.5 + t*0.05)*0.035;
  darkEnv += vec3(0.05,0.08,0.16)*exp(-abs(side)*3.0);  /* blue energy toward seam */

  vec3 col = mix(lightEnv, darkEnv, mixDark);

  /* crack lines glow inside the band */
  vec3 crackCol = mix(vec3(0.25,0.45,0.9), vec3(0.7,0.85,1.0), vor.y);
  col += crackCol * cracks * band * 1.4;
  /* faint dark crack lines on the light side for visibility */
  col -= vec3(0.35)*cracks*band*(1.0-mixDark)*0.8;

  /* ---- lightning along the seam ---- */
  float flick = step(0.55, hash(vec2(floor(t*9.0), 3.7)));
  float jag  = (fbm(vec2(uv.y*7.0, t*2.3))-0.5)*0.14;
  float bolt = exp(-abs(side + jag)*90.0);
  float jag2 = (fbm(vec2(uv.y*12.0+40.0, t*3.1))-0.5)*0.22;
  float bolt2= exp(-abs(side + jag2)*140.0);
  float flick2 = step(0.7, hash(vec2(floor(t*13.0), 9.2)));

  vec3 boltCol = vec3(0.55,0.75,1.0);
  col += boltCol * bolt  * (0.35 + 1.3*flick);
  col += vec3(0.9,0.95,1.0) * bolt2 * flick2 * 1.6;
  /* seam core glow */
  col += vec3(0.4,0.6,1.0) * exp(-abs(side)*30.0) * 0.5;

  /* subtle vignette */
  vec2 q = uv - 0.5;
  col *= 1.0 - dot(q,q)*0.55;

  /* mouse light */
  vec2 m = vec2(uMouse.x*aspect, uMouse.y);
  col += vec3(0.10,0.12,0.18) * exp(-length(p-m)*3.0) * mixDark;
  col += vec3(0.06) * exp(-length(p-m)*3.0) * (1.0-mixDark);

  gl_FragColor = vec4(col, 1.0);
}
`;

/** Mini live preview of the site in that realm — ported from the reference
 * prototype's theme-select cards (Tariwei.dc.html). */
function CardMock() {
  return (
    <div aria-hidden="true">
      <div className={styles.mockTop}>
        <span className={styles.mockBrand}>tariwei</span>
        <span className={styles.mockPills}>
          <span className={styles.mockPill} />
          <span className={styles.mockPill} />
          <span className={`${styles.mockPill} ${styles.mockPillAcc}`} />
        </span>
      </div>
      <div className={styles.mockHead}>
        From the metal
        <br />
        to the <span className={styles.mockSerif}>pixel.</span>
      </div>
      <div className={styles.mockSkels}>
        <span className={styles.mockSkel} style={{ width: "64%" }} />
        <span className={styles.mockSkel} style={{ width: "20%" }} />
      </div>
      <div className={styles.mockGrid}>
        <div className={styles.mockImg} />
        <div className={styles.mockCol}>
          <div className={styles.mockCell} />
          <div className={styles.mockCellAcc} />
        </div>
      </div>
    </div>
  );
}

const AUDIO_OPTIONS: { mode: AudioMode; label: string; hint: string }[] = [
  { mode: "none", label: "Silence", hint: "no sound at all" },
  { mode: "zen", label: "Zen", hint: "ambience + scroll sfx" },
  { mode: "classical", label: "Classical", hint: "a subtle piece of the day" },
];

export function RealmSelect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const firstAudioRef = useRef<HTMLButtonElement>(null);
  const blendTarget = useRef(0.5);
  const chosenAt = useRef(0);
  const lastPicked = useRef<Side>("dark");
  const [picked, setPicked] = useState<Side | null>(null);
  const returning = useSiteStore((s) => s.hasEnteredBefore);
  // Keeps the heading/color stable while the chosen screen fades out after "Choose again"
  const shown = picked ?? lastPicked.current;

  /* ---- WebGL background ---- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: true });
    if (!gl) return; // CSS #111 background stays as the fallback

    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const makeShader = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s));
      }
      return s;
    };

    const prog = gl.createProgram()!;
    gl.attachShader(prog, makeShader(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, makeShader(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "uRes");
    const uTime = gl.getUniformLocation(prog, "uTime");
    const uMouse = gl.getUniformLocation(prog, "uMouse");
    const uBlend = gl.getUniformLocation(prog, "uBlend");

    const mouse = [0.5, 0.5];
    let blend = 0.5;
    let raf = 0;

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();

    const onMove = (e: PointerEvent) => {
      mouse[0] = e.clientX / innerWidth;
      mouse[1] = 1 - e.clientY / innerHeight;
    };

    addEventListener("resize", resize);
    addEventListener("pointermove", onMove);

    const start = performance.now();
    const frame = () => {
      const t = reduceMotion ? 12.0 : (performance.now() - start) / 1000;
      blend += (blendTarget.current - blend) * 0.045;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, t);
      gl.uniform2f(uMouse, mouse[0], mouse[1]);
      gl.uniform1f(uBlend, blend);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      // No loseContext() here: under StrictMode the effect remounts on the
      // same canvas, and a deliberately lost context stays lost.
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
      removeEventListener("pointermove", onMove);
    };
  }, []);

  /* ---- whole card group tilts toward the cursor ---- */
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onMove = (e: PointerEvent) => {
      const el = cardsRef.current;
      if (!el) return;
      const x = e.clientX / innerWidth - 0.5;
      const y = e.clientY / innerHeight - 0.5;
      el.style.transform = `rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
    };
    addEventListener("pointermove", onMove);
    return () => removeEventListener("pointermove", onMove);
  }, []);

  const choose = useCallback((side: Side) => {
    setPicked(side);
    lastPicked.current = side;
    chosenAt.current = performance.now();
    blendTarget.current = side === "light" ? 0 : 1; // sweep the seam away
  }, []);

  // Move keyboard focus into the audio screen once it has faded in
  useEffect(() => {
    if (!picked) return;
    const id = setTimeout(() => firstAudioRef.current?.focus(), 550);
    return () => clearTimeout(id);
  }, [picked]);

  const back = useCallback(() => {
    setPicked(null);
    blendTarget.current = 0.5; // seam converges back
  }, []);

  const enter = useCallback(
    (mode: AudioMode) => {
      if (!picked) return;
      // The audio screen fades in over ~0.5s; ignore clicks that land on it
      // while it is still invisible (e.g. an impatient double-click on a card)
      if (performance.now() - chosenAt.current < 550) return;
      const store = useSiteStore.getState();
      store.setAudioMode(mode);
      store.setRealm(picked); // flips the page into the site
    },
    [picked]
  );

  return (
    <div
      className={styles.root}
      data-stage={picked ? "chosen" : "pick"}
      data-picked={picked ?? undefined}
    >
      <canvas ref={canvasRef} className={styles.gl} />

      <header className={styles.header}>
        <div className={styles.brand}>
          <Logo className="h-4 w-auto" />
        </div>
        <div className={styles.tagline}>One site · Two realities</div>
      </header>

      <main className={styles.stage} inert={picked !== null}>
        <div className={styles.cards} ref={cardsRef}>
          <div className={styles.cardCol}>
            <button
              type="button"
              className={`${styles.card} ${styles.light}`}
              onClick={() => choose("light")}
              aria-label="Enter light realm"
            >
              <div className={styles.cardInner}>
                <CardMock />
              </div>
            </button>
            <div className={styles.refLabel}>
              <span>LIGHT MODE</span>
              <span>CLICK TO ENTER ↗</span>
            </div>
          </div>

          <div className={styles.cardCol}>
            <button
              type="button"
              className={`${styles.card} ${styles.dark}`}
              onClick={() => choose("dark")}
              aria-label="Enter dark realm"
            >
              <div className={styles.cardInner}>
                <CardMock />
              </div>
            </button>
            <div className={styles.refLabel}>
              <span>DARK MODE</span>
              <span>CLICK TO ENTER ↗</span>
            </div>
          </div>
        </div>
      </main>

      <div className={styles.prompt}>
        {returning ? "Welcome back · choose your realm" : "Choose your realm to continue"}
      </div>

      <div
        className={styles.chosenMsg}
        inert={picked === null}
        style={{ color: shown === "light" ? "#0a0a0f" : "#f5f4f2" }}
      >
        <h1>{shown === "light" ? "Light realm" : "Dark realm"}</h1>
        <p>Now pick your sound</p>
        <div className={styles.audioRow}>
          {AUDIO_OPTIONS.map((opt, i) => (
            <button
              key={opt.mode}
              ref={i === 0 ? firstAudioRef : undefined}
              type="button"
              className={styles.audioBtn}
              onClick={() => enter(opt.mode)}
            >
              {opt.label}
              <span className={styles.audioBtnHint}>{opt.hint}</span>
            </button>
          ))}
        </div>
        <button type="button" className={styles.backBtn} onClick={back}>
          Choose again
        </button>
      </div>
    </div>
  );
}
