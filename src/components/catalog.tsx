"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@/components/three-canvas";
import { ALL_PROJECTS, type FeaturedProject } from "@/lib/projects";

/**
 * Project catalog, rebuilt to k95.it's actual shipped architecture (decoded
 * from their bundle — see DESIGN-NOTES.md "decoded" section): a cylinder of
 * shader panels viewed from OUTSIDE, wheel spins it with a velocity kick
 * that arches the panels (parabolic bend), per-panel idle wave, depth
 * tint/desaturate into the bg, spiral as a blended per-panel y-shift of the
 * same cylinder. Their center sculpture and wireframe guide are omitted —
 * Daniel's center stays empty. Colors come from our tokens, not theirs.
 */

type Mode = "rings" | "spiral";

// k95 constants (desktop tier), adapted: 12 panels/row x 3 rows (they run 5
// rows of repeated textures; 3 keeps repetition of our 9 projects tasteful)
const PANELS_PER_ROW = 12;
const ROWS = 3;
const WHEEL_ROT = 0.005;
const WHEEL_KICK = 0.004;
const BEND_H_FACTOR = 0.9; // scaled for our velocity units
const BEND_V_FACTOR = 0.8;
const MORPH_S = 1.1;

interface Tier {
  fov: number;
  cameraZ: number;
  radius: number;
  panelW: number;
  panelH: number;
  rowSpacing: number;
}

function tier(): Tier {
  const w = typeof window !== "undefined" ? window.innerWidth : 1280;
  if (w < 500) return { fov: 70, cameraZ: 7.5, radius: 4.5, panelW: 1.1, panelH: 1.54, rowSpacing: 5.5 };
  if (w < 768) return { fov: 70, cameraZ: 9.5, radius: 4.6, panelW: 1.1, panelH: 1.54, rowSpacing: 3.8 };
  if (w < 1024) return { fov: 60, cameraZ: 11, radius: 6.5, panelW: 1.32, panelH: 1.76, rowSpacing: 4 };
  return { fov: 50, cameraZ: 13, radius: 7.8, panelW: 1.54, panelH: 2.09, rowSpacing: 7 };
}

const VERTEX = /* glsl */ `
  uniform float uBendH;
  uniform float uBendV;
  uniform float uTime;
  uniform float uPhase;
  varying vec2 vUv;
  varying float vViewZ;
  void main() {
    vUv = uv;
    vec3 pos = position;
    float xn = (uv.x - 0.5) * 2.0;
    float yn = (uv.y - 0.5) * 2.0;
    float archX = 1.0 - xn * xn;
    float archY = 1.0 - yn * yn;
    pos.z -= archX * uBendH;
    pos.z -= archY * uBendV;
    pos.z += sin(uv.y * 6.283 + uTime * 0.55 + uPhase)
           * sin(uv.x * 3.14 + uTime * 0.35 + uPhase * 1.3) * 0.016;
    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    vViewZ = -mvPos.z;
    gl_Position = projectionMatrix * mvPos;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform sampler2D uTexture;
  uniform float uOpacity;
  uniform float uBlur;
  uniform float uDepthNear;
  uniform float uDepthFar;
  uniform vec3 uDepthColor;
  uniform float uDepthStrength;
  varying vec2 vUv;
  varying float vViewZ;

  vec4 sampleBlurred(sampler2D tex, vec2 uv, float blur) {
    if (blur <= 0.0005) return texture2D(tex, uv);
    vec4 acc  = texture2D(tex, uv) * 0.25;
    acc += texture2D(tex, uv + vec2( blur, 0.0)) * 0.125;
    acc += texture2D(tex, uv + vec2(-blur, 0.0)) * 0.125;
    acc += texture2D(tex, uv + vec2(0.0,  blur)) * 0.125;
    acc += texture2D(tex, uv + vec2(0.0, -blur)) * 0.125;
    acc += texture2D(tex, uv + vec2( blur,  blur)) * 0.0625;
    acc += texture2D(tex, uv + vec2(-blur,  blur)) * 0.0625;
    acc += texture2D(tex, uv + vec2( blur, -blur)) * 0.0625;
    acc += texture2D(tex, uv + vec2(-blur, -blur)) * 0.0625;
    return acc;
  }

  void main() {
    vec4 col = sampleBlurred(uTexture, vUv, uBlur);
    float depthT = smoothstep(uDepthNear, uDepthFar, vViewZ);
    float luma = dot(col.rgb, vec3(0.2126, 0.7152, 0.0722));
    vec3 toned = mix(col.rgb, vec3(luma), depthT * 0.25);
    toned = mix(toned, uDepthColor, depthT * uDepthStrength);
    col.rgb = toned;
    col.a *= uOpacity;
    gl_FragColor = col;
  }
`;

function makeTexture(p: FeaturedProject): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 640;
  const ctx = c.getContext("2d")!;

  const drawLabels = () => {
    const grad = ctx.createLinearGradient(0, 300, 0, 640);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,0.7)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 300, 512, 340);
    ctx.fillStyle = "rgba(244,243,239,0.95)";
    ctx.font = "600 40px Unbounded, sans-serif";
    ctx.fillText(p.name, 26, 596);
    ctx.fillStyle = "rgba(244,243,239,0.72)";
    ctx.font = "500 16px 'JetBrains Mono', monospace";
    ctx.fillText(p.tag, 26, 44);
    ctx.fillText(p.index, 452, 44);
  };

  const gradBg = ctx.createLinearGradient(0, 0, 512, 640);
  const stops = p.gradient.match(/#[0-9a-f]{6}/gi) ?? ["#26262b", "#0b0b0c"];
  stops.forEach((s, i) => gradBg.addColorStop(i / Math.max(1, stops.length - 1), s));
  ctx.fillStyle = gradBg;
  ctx.fillRect(0, 0, 512, 640);
  drawLabels();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    const scale = Math.max(512 / img.width, 640 / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, (512 - dw) / 2, (640 - dh) / 2, dw, dh);
    drawLabels();
    tex.needsUpdate = true;
  };
  img.src = p.image;

  return tex;
}

interface SharedState {
  /** k95 model (decoded from their loop): wheel moves rows VERTICALLY via a
   * lerped offset; Y-rotation is a constant idle spin plus a decaying
   * scroll-energy kick; hovering slow-mos the whole scene. */
  yTarget: number; // Re — wheel writes here
  y: number; // De — eased actual
  yPrev: number; // fe — for per-frame delta a
  kick: number; // L — scroll energy, decays x0.92/frame
  spin: number; // Te — accumulated idle+kick rotation
  bendH: number; // Be — eased kick bend
  bendV: number; // Ge — eased row-travel bend
  timeScale: number; // re — eases toward 0.3 on hover, 1 otherwise
  spiral: number; // J blend 0..1
  spiralTarget: number;
  hoveredIdx: number;
}

function Panels({
  shared,
  onHover,
  onOpen,
  t,
}: {
  shared: React.MutableRefObject<SharedState>;
  onHover: (slug: string | null) => void;
  onOpen: (slug: string) => void;
  t: Tier;
}) {
  const { camera } = useThree();
  const bg = useMemo(() => {
    const v = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
    return new THREE.Color(v || "#0b0b0c");
  }, []);

  const total = PANELS_PER_ROW * ROWS;
  const panels = useMemo(
    () =>
      Array.from({ length: total }, (_, k) => {
        const row = Math.floor(k / PANELS_PER_ROW);
        const i = k % PANELS_PER_ROW;
        const project = ALL_PROJECTS[(i + row * 5) % ALL_PROJECTS.length];
        return {
          row,
          i,
          project,
          baseAngle: ((i + row * 0.5) / PANELS_PER_ROW) * Math.PI * 2,
          ringY: (row - (ROWS - 1) / 2) * (t.panelH * 1.25),
          spiralShift: (i / PANELS_PER_ROW - 0.5) * t.rowSpacing,
          phase: Math.random() * Math.PI * 2,
        };
      }),
    [total, t]
  );

  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const geometry = useMemo(() => new THREE.PlaneGeometry(t.panelW, t.panelH, 12, 8), [t]);
  const materials = useMemo(
    () =>
      panels.map(
        (p) =>
          new THREE.ShaderMaterial({
            uniforms: {
              uTexture: { value: makeTexture(p.project) },
              uBendH: { value: 0 },
              uBendV: { value: 0 },
              uTime: { value: 0 },
              uPhase: { value: p.phase },
              uOpacity: { value: 0 },
              uBlur: { value: 0.15 },
              uDepthNear: { value: t.cameraZ * 0.58 },
              uDepthFar: { value: t.cameraZ * 1.85 },
              uDepthColor: { value: bg },
              uDepthStrength: { value: 0.8 },
            },
            vertexShader: VERTEX,
            fragmentShader: FRAGMENT,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
          })
      ),
    [panels, t, bg]
  );

  const born = useRef<number | null>(null);

  useFrame(({ clock }, delta) => {
    const s = shared.current;
    if (born.current === null) born.current = clock.elapsedTime;
    const age = clock.elapsedTime - born.current;

    // hover slow-mo: scene time eases toward 30% while a panel is hovered
    s.timeScale += ((s.hoveredIdx >= 0 ? 0.3 : 1) - s.timeScale) * 0.1;
    const n = delta * s.timeScale;

    // k95 loop, fps-normalized: De += (Re-De)*0.1/frame; L *= 0.92^frames;
    // Te += (0.08 + L) * dt; bends ease toward clamped targets
    const lerpK = 1 - Math.exp(-6.3 * n);
    s.y += (s.yTarget - s.y) * lerpK;
    const a = s.y - s.yPrev;
    s.yPrev = s.y;
    s.kick *= Math.pow(0.92, n * 60);
    s.spin += (0.08 + s.kick) * n;
    s.bendH += (THREE.MathUtils.clamp(s.kick * 0.1, -0.25, 0.25) - s.bendH) * 0.08;
    s.bendV += (THREE.MathUtils.clamp(a * 8, -0.15, 0.15) - s.bendV) * 0.12;
    s.spiral = THREE.MathUtils.damp(s.spiral, s.spiralTarget, 4 / MORPH_S, delta);

    // rows travel vertically with scroll and wrap (their span: rows*spacing)
    const rowGap = t.rowSpacing * (1 - s.spiral * 0.45);
    const span = ROWS * rowGap;

    panels.forEach((p, k) => {
      const mesh = meshRefs.current[k];
      if (!mesh) return;
      const angle = p.baseAngle + s.spin;
      const baseY =
        (p.row - (ROWS - 1) / 2) * rowGap + p.spiralShift * s.spiral + s.y;
      let y = baseY;
      if (y > span / 2 + rowGap) y -= span + rowGap * 2;
      if (y < -span / 2 - rowGap) y += span + rowGap * 2;

      mesh.position.set(Math.sin(angle) * t.radius, y, Math.cos(angle) * t.radius);
      mesh.rotation.set(0, angle, 0);

      const mat = materials[k];
      mat.uniforms.uTime.value = clock.elapsedTime;
      mat.uniforms.uBendH.value = s.bendH;
      mat.uniforms.uBendV.value = s.bendV;
      // entrance: fade in + unblur over first 1.2s, staggered by panel
      const enter = THREE.MathUtils.clamp(age * 1.4 - k * 0.02, 0, 1);
      mat.uniforms.uBlur.value = 0.15 * (1 - enter);
      const front = Math.cos(angle) > 0 ? Math.cos(angle) : 0;
      const hovered = s.hoveredIdx === k;
      // rear-facing panels ghost out hard (k95 read; also hides the
      // mirrored back-face text DoubleSide would otherwise show)
      mat.uniforms.uOpacity.value = enter * (0.3 + 0.7 * front);
      const scale = hovered ? 1.08 : 1;
      const easeK = 1 - Math.exp(-8 * delta);
      mesh.scale.setScalar(mesh.scale.x + (scale - mesh.scale.x) * easeK);
    });

    // keep camera fixed, look at cylinder center
    camera.position.set(0, 0, t.cameraZ);
    camera.lookAt(0, 0, 0);
  });

  return (
    <>
      {panels.map((p, k) => (
        <mesh
          key={k}
          ref={(el) => {
            meshRefs.current[k] = el;
          }}
          geometry={geometry}
          material={materials[k]}
          onPointerOver={(e) => {
            e.stopPropagation();
            shared.current.hoveredIdx = k;
            onHover(p.project.slug);
          }}
          onPointerOut={() => {
            if (shared.current.hoveredIdx === k) shared.current.hoveredIdx = -1;
            onHover(null);
          }}
          onClick={(e) => {
            e.stopPropagation();
            onOpen(p.project.slug);
          }}
        />
      ))}
    </>
  );
}

function Cursor({
  hovered,
  containerRef,
}: {
  hovered: FeaturedProject | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const raw = useRef({ x: -200, y: -200 });
  const pos = useRef({ x: -200, y: -200 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      raw.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, [containerRef]);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      pos.current.x += (raw.current.x - pos.current.x) * 0.16;
      pos.current.y += (raw.current.y - pos.current.y) * 0.16;
      if (ref.current) {
        ref.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(14px, -50%)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={ref} className="pointer-events-none absolute left-0 top-0 z-30 hidden md:block">
      <div className="flex items-center gap-2 rounded-full border border-ln bg-bg/80 px-3.5 py-2 backdrop-blur-md">
        <span className="h-2 w-2 rounded-full bg-acc" />
        {hovered ? (
          <span className="whitespace-nowrap font-mono text-[10px] tracking-[0.14em] text-ink">
            {hovered.name}
            <span className="ml-2 text-mut">{hovered.tag}</span>
            <span className="ml-2 text-acc">↗</span>
          </span>
        ) : (
          <span className="font-mono text-[10px] tracking-[0.2em] text-mut">SCROLL</span>
        )}
      </div>
    </div>
  );
}

export function Catalog() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("rings");
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const shared = useRef<SharedState>({
    yTarget: 0,
    y: 0,
    yPrev: 0,
    kick: 0,
    spin: 0,
    bendH: 0,
    bendV: 0,
    timeScale: 1,
    spiral: 0,
    spiralTarget: 0,
    hoveredIdx: -1,
  });
  const t = useMemo(() => tier(), []);

  // k95 input model: wheel spins the cylinder directly (no page scroll)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      shared.current.yTarget -= e.deltaY * WHEEL_ROT;
      shared.current.kick = THREE.MathUtils.clamp(
        shared.current.kick + e.deltaY * WHEEL_KICK,
        -2,
        2
      );
    };
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      const dy = touchY - e.touches[0].clientY;
      touchY = e.touches[0].clientY;
      shared.current.yTarget -= dy * WHEEL_ROT * 1.6;
      shared.current.kick = THREE.MathUtils.clamp(shared.current.kick + dy * WHEEL_KICK * 1.75, -2, 2);
    };
    el.addEventListener("wheel", onWheel, { passive: true });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  useEffect(() => {
    shared.current.spiralTarget = mode === "spiral" ? 1 : 0;
  }, [mode]);

  const onHover = useCallback((slug: string | null) => setHoveredSlug(slug), []);
  const onOpen = useCallback((slug: string) => router.push(`/projects/${slug}`), [router]);

  const hovered = ALL_PROJECTS.find((p) => p.slug === hoveredSlug) ?? null;

  return (
    <div
      ref={containerRef}
      className="relative h-screen w-full overflow-hidden"
      style={{ cursor: "none" }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-20 z-20 flex items-start justify-center px-6 md:px-10">
        <div className="pointer-events-auto flex gap-1 rounded-full border border-ln bg-bg/70 p-1 backdrop-blur-md">
          {(["rings", "spiral"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="rounded-full px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors"
              style={{
                background: m === mode ? "var(--ink)" : "transparent",
                color: m === mode ? "var(--bg)" : "var(--mut)",
                cursor: "none",
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="absolute inset-0">
        <ThreeCanvas camera={{ position: [0, 0, t.cameraZ], fov: t.fov }}>
          <Panels shared={shared} onHover={onHover} onOpen={onOpen} t={t} />
        </ThreeCanvas>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-5 z-20 flex justify-center">
        <span className="font-mono text-[10px] tracking-[0.2em] text-mut">
          {String(ALL_PROJECTS.length).padStart(2, "0")} /{" "}
          {String(ALL_PROJECTS.length).padStart(2, "0")} selected{" "}
          <span className="text-ink underline underline-offset-4">Works</span>
        </span>
      </div>

      <Cursor hovered={hovered} containerRef={containerRef} />
    </div>
  );
}
