"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { FEATURED_PROJECTS, type FeaturedProject } from "@/lib/projects";

type Mode = "rings" | "spiral";

interface Placement {
  pos: [number, number, number];
  rotY: number;
  tiltX: number;
}

const ITEMS_PER_RING = 6;
const GOLDEN_ANGLE = 2.39996;

function ringPlacement(i: number, n: number): Placement {
  const ringIndex = Math.floor(i / ITEMS_PER_RING);
  const ringCount = Math.max(1, Math.ceil(n / ITEMS_PER_RING));
  const posInRing = i % ITEMS_PER_RING;
  const countInThisRing = Math.min(ITEMS_PER_RING, n - ringIndex * ITEMS_PER_RING);
  const radius = 4 + ringIndex * 2.6;
  const angle = (posInRing / countInThisRing) * Math.PI * 2 + ringIndex * 0.35;
  const y = ringIndex * 1.4 - ((ringCount - 1) * 1.4) / 2;
  return {
    pos: [radius * Math.cos(angle), y, radius * Math.sin(angle)],
    rotY: -angle + Math.PI / 2,
    tiltX: -0.12 + Math.sin(i * 1.7) * 0.06,
  };
}

function spiralPlacement(i: number): Placement {
  const angle = i * GOLDEN_ANGLE;
  const radius = 1.6 + i * 1.05;
  const y = 2.4 - i * 0.75;
  return {
    pos: [radius * Math.cos(angle), y, radius * Math.sin(angle)],
    rotY: -angle + Math.PI / 2,
    tiltX: -0.12 + Math.cos(i * 1.3) * 0.06,
  };
}

function CatalogItem({
  project,
  mode,
  index,
  count,
  scrollRotation,
  onHover,
  hovered,
}: {
  project: FeaturedProject;
  mode: Mode;
  index: number;
  count: number;
  scrollRotation: React.MutableRefObject<number>;
  onHover: (slug: string | null) => void;
  hovered: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const current = useRef<Placement>(mode === "rings" ? ringPlacement(index, count) : spiralPlacement(index));

  useFrame((_, delta) => {
    const target = mode === "rings" ? ringPlacement(index, count) : spiralPlacement(index);
    const c = current.current;
    const lerpFactor = 1 - Math.pow(0.02, delta);
    c.pos = [
      THREE.MathUtils.lerp(c.pos[0], target.pos[0], lerpFactor),
      THREE.MathUtils.lerp(c.pos[1], target.pos[1], lerpFactor),
      THREE.MathUtils.lerp(c.pos[2], target.pos[2], lerpFactor),
    ];
    c.rotY = THREE.MathUtils.lerp(c.rotY, target.rotY, lerpFactor);
    c.tiltX = THREE.MathUtils.lerp(c.tiltX, target.tiltX, lerpFactor);

    if (groupRef.current) {
      groupRef.current.position.set(...c.pos);
      groupRef.current.rotation.set(c.tiltX, c.rotY + scrollRotation.current, 0);
    }
  });

  return (
    <group ref={groupRef}>
      <Html
        transform
        occlude={false}
        distanceFactor={6}
        style={{ pointerEvents: "auto" }}
      >
        <a
          href={`/projects/${project.slug}`}
          onMouseEnter={() => onHover(project.slug)}
          onMouseLeave={() => onHover(null)}
          className="block w-[220px] overflow-hidden rounded-xl border border-ln shadow-2xl transition-transform duration-300"
          style={{
            transform: hovered ? "scale(1.06)" : "scale(1)",
            cursor: "none",
          }}
        >
          <div
            className="flex aspect-[4/3] flex-col justify-between p-4"
            style={{ background: project.gradient }}
          >
            <div className="flex items-center justify-between font-mono text-[9px] tracking-[0.2em] text-mut">
              <span>{project.index}</span>
              <span>{project.tag}</span>
            </div>
            <h4 className="font-display text-lg text-ink">{project.name}</h4>
          </div>
        </a>
      </Html>
    </group>
  );
}

function Cursor({ hoveredSlug, containerRef }: { hoveredSlug: string | null; containerRef: React.RefObject<HTMLDivElement | null> }) {
  const dotRef = useRef<HTMLDivElement>(null);
  const raw = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      raw.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, [containerRef]);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      pos.current.x = THREE.MathUtils.lerp(pos.current.x, raw.current.x, 0.18);
      pos.current.y = THREE.MathUtils.lerp(pos.current.y, raw.current.y, 0.18);
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-50%, -50%) scale(${hoveredSlug ? 2 : 1})`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hoveredSlug]);

  return (
    <div
      ref={dotRef}
      className="pointer-events-none absolute left-0 top-0 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-acc font-mono text-[9px] tracking-[0.15em] text-acc transition-[background-color] duration-200"
      style={{ background: hoveredSlug ? "var(--acc)" : "transparent", color: hoveredSlug ? "var(--bg)" : "var(--acc)" }}
    >
      {hoveredSlug ? "VIEW" : ""}
    </div>
  );
}

export function Catalog() {
  const [mode, setMode] = useState<Mode>("spiral");
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRotation = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      scrollRotation.current = el.scrollTop * 0.006;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const items = useMemo(() => FEATURED_PROJECTS, []);

  const onHover = useCallback((slug: string | null) => setHoveredSlug(slug), []);

  return (
    <div
      ref={containerRef}
      className="relative h-screen w-full overflow-y-auto overflow-x-hidden"
      style={{ cursor: "none" }}
    >
      <div className="pointer-events-none sticky top-0 z-20 flex items-center justify-between px-6 pt-6 md:px-10">
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-mut">
          scroll to rotate · hover to inspect
        </span>
        <div className="pointer-events-auto flex gap-1 rounded-full border border-ln bg-bg/70 p-1 backdrop-blur-md">
          {(["rings", "spiral"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors"
              style={{
                background: mode === m ? "var(--acc)" : "transparent",
                color: mode === m ? "var(--bg)" : "var(--mut)",
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: `${200 + items.length * 60}vh` }}>
        <div className="sticky top-0 h-screen w-full">
          <Canvas camera={{ position: [0, 1.4, 9.5], fov: 45 }} gl={{ antialias: true, alpha: true }}>
            {items.map((p, i) => (
              <CatalogItem
                key={p.slug}
                project={p}
                mode={mode}
                index={i}
                count={items.length}
                scrollRotation={scrollRotation}
                onHover={onHover}
                hovered={hoveredSlug === p.slug}
              />
            ))}
          </Canvas>
        </div>
      </div>

      <Cursor hoveredSlug={hoveredSlug} containerRef={containerRef} />
    </div>
  );
}
