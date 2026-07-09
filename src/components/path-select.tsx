"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Instance, Instances } from "@react-three/drei";
import { motion } from "framer-motion";
import { useSiteStore, type Path } from "@/lib/store";

/**
 * Second immersive portal — "Engineer or Business Owner", shown as a
 * scroll-triggered section on the homepage (not a full navigation gate like
 * the realm picker). Reuses the angled-card + scattered-shard visual
 * language from RealmSelect for consistency, but both cards share the
 * SAME active realm palette (this choice isn't a color scheme).
 */

type Side = "engineer" | "business";

function useInkColor(): string {
  const [ink, setInk] = useState("#f4f3ef");
  useEffect(() => {
    const read = () => {
      const v = getComputedStyle(document.documentElement).getPropertyValue("--ink").trim();
      if (v) setInk(v);
    };
    read();
    const id = window.setInterval(read, 800);
    return () => window.clearInterval(id);
  }, []);
  return ink;
}

type ShardDef = {
  pos: THREE.Vector3;
  rot: THREE.Euler;
  spin: number;
  driftPhase: number;
  restScale: number;
  fullScale: number;
};

function buildShards(count: number, spread: readonly [readonly [number, number], readonly [number, number], readonly [number, number]]): ShardDef[] {
  const [xr, yr, zr] = spread;
  return Array.from({ length: count }, () => ({
    pos: new THREE.Vector3(
      THREE.MathUtils.randFloat(xr[0], xr[1]),
      THREE.MathUtils.randFloat(yr[0], yr[1]),
      THREE.MathUtils.randFloat(zr[0], zr[1])
    ),
    rot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
    spin: THREE.MathUtils.randFloat(0.04, 0.14) * (Math.random() > 0.5 ? 1 : -1),
    driftPhase: Math.random() * Math.PI * 2,
    restScale: THREE.MathUtils.randFloat(0.5, 0.8),
    fullScale: THREE.MathUtils.randFloat(0.8, 1.2),
  }));
}

function ShardField({
  anchor,
  rotationY,
  tint,
  phase,
  getIntensity,
  spread,
  count,
}: {
  anchor: [number, number, number];
  rotationY: number;
  tint: string;
  phase: number;
  getIntensity: () => number;
  spread: readonly [readonly [number, number], readonly [number, number], readonly [number, number]];
  count: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const instanceRefs = useRef<(THREE.Group | null)[]>([]);

  const geometry = useMemo(() => {
    const g = new THREE.TetrahedronGeometry(0.15, 0);
    g.scale(1, 0.55, 1);
    return g;
  }, []);

  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(tint),
        transmission: 0.5,
        thickness: 0.6,
        roughness: 0.25,
        ior: 1.3,
        iridescence: 0.3,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    [tint]
  );

  const defs = useMemo(() => buildShards(count, spread), [count, spread]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const intensity = getIntensity();

    if (groupRef.current) {
      groupRef.current.scale.setScalar(1 + 0.03 * Math.sin(t * 0.5 + phase));
    }

    instanceRefs.current.forEach((obj, i) => {
      if (!obj) return;
      const d = defs[i];
      const scale = THREE.MathUtils.lerp(d.restScale, d.fullScale, 0.5 + 0.5 * intensity);
      obj.scale.setScalar(scale);
      obj.position.set(
        d.pos.x + Math.sin(t * 0.4 + d.driftPhase) * 0.06,
        d.pos.y + Math.cos(t * 0.33 + d.driftPhase * 1.3) * 0.06,
        d.pos.z
      );
      obj.rotation.set(d.rot.x + t * d.spin, d.rot.y + t * d.spin * 0.7, d.rot.z);
    });
  });

  return (
    <group ref={groupRef} position={anchor} rotation={[0, rotationY, 0]}>
      <Instances geometry={geometry} material={material} limit={defs.length}>
        {defs.map((_, i) => (
          <Instance
            key={i}
            ref={(el) => {
              instanceRefs.current[i] = el as THREE.Group | null;
            }}
          />
        ))}
      </Instances>
    </group>
  );
}

function Scene({ hoveredSide, ink }: { hoveredSide: Side | null; ink: string }) {
  const { viewport } = useThree();
  const intensityA = useRef(0.3);
  const intensityB = useRef(0.3);

  useFrame((_, delta) => {
    intensityA.current = THREE.MathUtils.damp(intensityA.current, hoveredSide === "engineer" ? 1 : 0.3, 4, delta);
    intensityB.current = THREE.MathUtils.damp(intensityB.current, hoveredSide === "business" ? 1 : 0.3, 4, delta);
  });

  const anchorX = Math.max(0.55, viewport.width * 0.19);

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[0, 3, 5]} intensity={0.9} color={ink} />
      <ShardField
        anchor={[-anchorX, 0, 0]}
        rotationY={0.4}
        tint={ink}
        phase={0}
        getIntensity={() => intensityA.current}
        spread={[[-1.2, 0.9], [-1.7, 1.7], [-0.3, 0.3]]}
        count={22}
      />
      <ShardField
        anchor={[anchorX, 0, 0]}
        rotationY={-0.4}
        tint={ink}
        phase={1.6}
        getIntensity={() => intensityB.current}
        spread={[[-0.9, 1.2], [-1.7, 1.7], [-0.3, 0.3]]}
        count={22}
      />
    </>
  );
}

function PathCard({
  side,
  label,
  tagline,
  hovered,
  onEnter,
  onLeave,
  onPick,
  tiltDeg,
}: {
  side: Side;
  label: string;
  tagline: string;
  hovered: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onPick: () => void;
  tiltDeg: number;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Enter as ${label}`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      onClick={onPick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onPick();
        }
      }}
      className="group relative w-full max-w-[420px] sm:w-[38vw] cursor-pointer outline-none"
      style={{
        transform: `rotateY(${tiltDeg}deg)`,
        transformStyle: "preserve-3d",
        transition: "transform 0.6s cubic-bezier(.22,.7,.16,1)",
      }}
    >
      <div
        className="relative overflow-hidden border border-ln px-6 py-8 sm:px-8 sm:py-10 transition-[backdrop-filter,box-shadow,transform] duration-500"
        style={{
          background: "color-mix(in srgb, var(--bg) 55%, transparent)",
          backdropFilter: `blur(${hovered ? 24 : 12}px) saturate(140%)`,
          WebkitBackdropFilter: `blur(${hovered ? 24 : 12}px) saturate(140%)`,
          boxShadow: hovered ? "0 30px 80px rgba(0,0,0,0.3)" : "0 14px 40px rgba(0,0,0,0.15)",
          transform: hovered ? "scale(1.03)" : "scale(1)",
        }}
      >
        <p className="font-mono text-[10px] tracking-[0.24em] uppercase text-mut">
          {hovered ? "release to enter" : "hover"}
        </p>
        <h3 className="mt-6 font-display text-[clamp(28px,4.6vw,56px)] leading-[1] text-ink">
          {label}
        </h3>
        <p className="mt-3 max-w-[26ch] font-sans text-[13px] text-mut">{tagline}</p>
        <p className="mt-8 font-mono text-[10px] tracking-[0.2em] text-ink">enter →</p>
      </div>
    </div>
  );
}

export function PathSelect() {
  const router = useRouter();
  const ink = useInkColor();
  const [hoveredSide, setHoveredSide] = useState<Side | null>(null);
  const isNarrow = typeof window !== "undefined" ? window.innerWidth < 640 : false;

  const handlePick = useCallback(
    (side: Side) => {
      const path: Path = side;
      useSiteStore.getState().setPath(path);
      router.push(side === "engineer" ? "/engineer" : "/business");
    },
    [router]
  );

  return (
    <section className="relative min-h-screen w-full overflow-hidden px-6 md:px-10 py-24">
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, 7.5], fov: 42 }} gl={{ antialias: true, alpha: true }} dpr={[1, 2]}>
          <Scene hoveredSide={hoveredSide} ink={ink} />
        </Canvas>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-3 text-center">
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.5 }}
          className="font-mono text-[10px] uppercase tracking-[0.28em] text-mut"
        >
          {"//"} 03 — CHOOSE YOUR PATH
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display text-[clamp(2rem,6vw,4.2rem)] leading-[0.95] tracking-tight text-ink"
        >
          Engineer, or <span className="font-accent italic text-acc">business owner</span>?
        </motion.h2>
      </div>

      <div className="relative z-10 mt-16 flex flex-col items-center justify-center gap-8 sm:flex-row sm:gap-[6vw]">
        <PathCard
          side="engineer"
          label="Engineer"
          tagline="Stacks, architecture, research, hackathons."
          hovered={hoveredSide === "engineer"}
          onEnter={() => setHoveredSide("engineer")}
          onLeave={() => setHoveredSide((s) => (s === "engineer" ? null : s))}
          onPick={() => handlePick("engineer")}
          tiltDeg={isNarrow ? 0 : 16}
        />
        <PathCard
          side="business"
          label="Business Owner"
          tagline="Case studies, pitch decks, and getting a project scoped."
          hovered={hoveredSide === "business"}
          onEnter={() => setHoveredSide("business")}
          onLeave={() => setHoveredSide((s) => (s === "business" ? null : s))}
          onPick={() => handlePick("business")}
          tiltDeg={isNarrow ? 0 : -16}
        />
      </div>
    </section>
  );
}
