"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@/components/three-canvas";
import { ALL_PROJECTS, type FeaturedProject } from "@/lib/projects";

/**
 * Project catalog — geometry and interaction observed live on k95.it/en
 * (DESIGN-NOTES.md), minus the parts Daniel banned (center sculpture, bg
 * grid). Camera sits inside a sphere of curved, bg-tinted cards; scroll
 * rotates the sphere with inertia; the card nearest front-center scales up
 * and regains full color. Spiral mode reflows the same cards onto a helix
 * that rolls downward as you scroll. Cursor is a "SCROLL" pill that becomes
 * a name chip over a card. Center stays empty (cinetica rule).
 */

type Mode = "rings" | "spiral";

const CARD_W = 2.2;
const CARD_H = 1.5;
const SPHERE_R = 5.2;
const BEND_R = SPHERE_R * 0.92;

interface Slot {
  pos: THREE.Vector3;
  rotY: number;
  tiltX: number;
}

function ringSlot(i: number, n: number): Slot {
  const bands = n <= 6 ? 1 : n <= 14 ? 2 : 3;
  const band = i % bands;
  const idxInBand = Math.floor(i / bands);
  const countInBand = Math.ceil(n / bands);
  const angle = (idxInBand / countInBand) * Math.PI * 2 + band * 0.45;
  const y = bands === 1 ? 0 : (band - (bands - 1) / 2) * 2.1;
  const r = SPHERE_R * Math.cos(Math.asin(Math.min(0.9, Math.abs(y) / SPHERE_R)));
  return {
    pos: new THREE.Vector3(r * Math.sin(angle), y, -r * Math.cos(angle)),
    rotY: angle,
    tiltX: y * -0.06,
  };
}

function spiralSlot(i: number, n: number): Slot {
  const turns = Math.max(1.5, n / 5);
  const t = i / Math.max(1, n - 1);
  const angle = t * Math.PI * 2 * turns;
  const y = 3.2 - t * 6.4;
  const r = SPHERE_R * 0.82;
  return {
    pos: new THREE.Vector3(r * Math.sin(angle), y, -r * Math.cos(angle)),
    rotY: angle,
    tiltX: -0.1,
  };
}

/** Curved plane bent around the vertical axis, concave toward the camera
 * at sphere center — cards read as lying on the sphere's inner surface. */
function useBentGeometry() {
  return useMemo(() => {
    const geo = new THREE.PlaneGeometry(CARD_W, CARD_H, 24, 1);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const theta = x / BEND_R;
      pos.setX(i, BEND_R * Math.sin(theta));
      pos.setZ(i, BEND_R * (1 - Math.cos(theta)));
    }
    geo.computeVertexNormals();
    return geo;
  }, []);
}

/** Placeholder texture per project until the CMS supplies real imagery:
 * the project's gradient plus its name, drawn once to an offscreen canvas. */
function makeTexture(p: FeaturedProject): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 352;
  const ctx = c.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, 0, 512, 352);
  const stops = p.gradient.match(/#[0-9a-f]{6}/gi) ?? ["#26262b", "#0b0b0c"];
  stops.forEach((s, i) => grad.addColorStop(i / Math.max(1, stops.length - 1), s));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 352);
  ctx.fillStyle = "rgba(244,243,239,0.92)";
  ctx.font = "600 44px Unbounded, sans-serif";
  ctx.fillText(p.name, 28, 310);
  ctx.fillStyle = "rgba(244,243,239,0.55)";
  ctx.font = "500 17px 'JetBrains Mono', monospace";
  ctx.fillText(p.tag, 28, 44);
  ctx.fillText(p.index, 448, 44);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

interface CardState {
  focus: number;
  hover: boolean;
}

function CatalogCard({
  project,
  index,
  count,
  mode,
  rotYRef,
  bgColor,
  onHover,
  onClick,
  stateRef,
}: {
  project: FeaturedProject;
  index: number;
  count: number;
  mode: Mode;
  rotYRef: React.MutableRefObject<number>;
  bgColor: THREE.Color;
  onHover: (slug: string | null) => void;
  onClick: (slug: string) => void;
  stateRef: React.MutableRefObject<CardState>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometry = useBentGeometry();
  const texture = useMemo(() => makeTexture(project), [project]);
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
        transparent: true,
      }),
    [texture]
  );
  const current = useRef<Slot>(mode === "rings" ? ringSlot(index, count) : spiralSlot(index, count));
  const white = useMemo(() => new THREE.Color("#ffffff"), []);
  const tmp = useMemo(() => new THREE.Color(), []);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const target = mode === "rings" ? ringSlot(index, count) : spiralSlot(index, count);
    const k = 1 - Math.pow(0.012, delta);
    current.current.pos.lerp(target.pos, k);
    current.current.rotY = THREE.MathUtils.lerp(current.current.rotY, target.rotY, k);
    current.current.tiltX = THREE.MathUtils.lerp(current.current.tiltX, target.tiltX, k);

    const rotY = rotYRef.current;
    const slot = current.current;
    // spin the whole arrangement: rotate slot position around Y by rotY
    const cos = Math.cos(rotY);
    const sin = Math.sin(rotY);
    const x = slot.pos.x * cos - slot.pos.z * sin;
    const z = slot.pos.x * sin + slot.pos.z * cos;
    let y = slot.pos.y;
    if (mode === "spiral") {
      // spiral rolls downward with scroll: shift y by rotation, wrap around
      const span = 7.2;
      y = ((slot.pos.y - rotY * 0.9 + span / 2) % span + span) % span - span / 2;
    }
    mesh.position.set(x, y, z);
    // face the camera at the sphere's center: normal must point back toward
    // the origin, i.e. rotation.y = -(slot angle + spin). The earlier
    // +PI variant showed the plane's back face (mirrored textures).
    mesh.rotation.set(slot.tiltX, -(slot.rotY + rotY), 0);

    // focus = how close this card is to front-center (facing the camera at +z... camera at origin looking -z; front slot is z<0 x~0)
    const frontness = Math.max(0, -z / SPHERE_R) * Math.max(0, 1 - Math.abs(x) / 2.4) * Math.max(0, 1 - Math.abs(y) / 2.2);
    const st = stateRef.current;
    st.focus = THREE.MathUtils.damp(st.focus, frontness, 5, delta);

    const lift = st.hover ? Math.max(st.focus, 0.75) : st.focus;
    const scale = 1 + lift * 0.55;
    mesh.scale.setScalar(scale);
    // tint toward bg when unfocused (k95 duotone read), full color at focus
    tmp.copy(bgColor).lerp(white, 0.5 + lift * 0.5);
    material.color.copy(tmp);
    material.opacity = 0.85 + lift * 0.15;
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      onPointerOver={(e) => {
        e.stopPropagation();
        stateRef.current.hover = true;
        onHover(project.slug);
      }}
      onPointerOut={() => {
        stateRef.current.hover = false;
        onHover(null);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(project.slug);
      }}
    />
  );
}

function Scene({
  mode,
  rotYRef,
  onHover,
  onClick,
}: {
  mode: Mode;
  rotYRef: React.MutableRefObject<number>;
  onHover: (slug: string | null) => void;
  onClick: (slug: string) => void;
}) {
  const { scene } = useThree();
  const bgColor = useMemo(() => {
    const v =
      typeof window !== "undefined"
        ? getComputedStyle(document.documentElement).getPropertyValue("--bg").trim()
        : "";
    return new THREE.Color(v || "#0b0b0c");
  }, []);
  useEffect(() => {
    scene.background = null;
  }, [scene]);

  const stateRefs = useRef(ALL_PROJECTS.map(() => ({ focus: 0, hover: false })));

  return (
    <>
      {ALL_PROJECTS.map((p, i) => (
        <CatalogCard
          key={p.slug}
          project={p}
          index={i}
          count={ALL_PROJECTS.length}
          mode={mode}
          rotYRef={rotYRef}
          bgColor={bgColor}
          onHover={onHover}
          onClick={onClick}
          stateRef={{ current: stateRefs.current[i] } as React.MutableRefObject<CardState>}
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
  const raw = useRef({ x: -100, y: -100 });
  const pos = useRef({ x: -100, y: -100 });

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
        ref.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(12px, -50%)`;
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
  const rotY = useRef(0);
  const rotYTarget = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      rotYTarget.current = el.scrollTop * 0.0042;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // inertial rotation: damp actual toward target every frame (outside R3F so
  // the cursor and scene share one value)
  useEffect(() => {
    let raf: number;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      rotY.current = THREE.MathUtils.damp(rotY.current, rotYTarget.current, 2.2, dt);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onHover = useCallback((slug: string | null) => setHoveredSlug(slug), []);
  const onClick = useCallback(
    (slug: string) => router.push(`/projects/${slug}`),
    [router]
  );

  const hovered = ALL_PROJECTS.find((p) => p.slug === hoveredSlug) ?? null;

  return (
    <div
      ref={containerRef}
      className="relative h-screen w-full overflow-y-auto overflow-x-hidden"
      style={{ cursor: "none" }}
    >
      <div className="pointer-events-none sticky top-16 z-20 flex items-start justify-center px-6 md:px-10">
        <div className="pointer-events-auto flex gap-1 rounded-full border border-ln bg-bg/70 p-1 backdrop-blur-md">
          {(["rings", "spiral"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="rounded-full px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors"
              style={{
                background: mode === m ? "var(--ink)" : "transparent",
                color: mode === m ? "var(--bg)" : "var(--mut)",
                cursor: "none",
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: "560vh" }}>
        <div className="sticky top-0 h-screen w-full">
          <ThreeCanvas camera={{ position: [0, 0, 0.01], fov: 60 }}>
            <Scene mode={mode} rotYRef={rotY} onHover={onHover} onClick={onClick} />
          </ThreeCanvas>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-20 flex justify-center">
        <span className="font-mono text-[10px] tracking-[0.2em] text-mut">
          {String(ALL_PROJECTS.length).padStart(2, "0")} / {String(ALL_PROJECTS.length).padStart(2, "0")} selected{" "}
          <span className="text-ink underline underline-offset-4">Works</span>
        </span>
      </div>

      <Cursor hovered={hovered} containerRef={containerRef} />
    </div>
  );
}
