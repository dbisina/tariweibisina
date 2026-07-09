"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Instance, Instances } from "@react-three/drei";
import { useSiteStore } from "@/lib/store";
import { Logo } from "@/components/logo";

/**
 * Attempt C — "Choose Your Realm" portal.
 *
 * Design decision: the card itself is never a single solid mesh (that reads
 * as the banned rounded-corner SaaS card / browser-chrome mockup). Instead:
 *  - A React Three Fiber canvas renders two tilted fields of scattered glass
 *    shards (one per realm) plus a third "rift" field where the two fields
 *    interleave in the empty middle gap, lit by a pulsing additive-shader
 *    glow band — the literal collision the brief asks for.
 *  - A thin DOM layer sits on top as the actual "glass pane" per card, using
 *    real backdrop-filter blur so the WebGL shard field is genuinely visible
 *    refracted/blurred through it — no fake mockup, just real token-colored
 *    content (mini nav + heading) using the site's own CSS variables scoped
 *    per realm via a local `data-realm` attribute.
 */

type Side = "dark" | "light";

interface RealmColorSet {
  bg: string;
  ink: string;
  acc: string;
  acc2: string;
}

interface RealmColors {
  dark: RealmColorSet;
  light: RealmColorSet;
}

const FALLBACK_COLORS: RealmColors = {
  dark: { bg: "#0b0b0c", ink: "#f4f3ef", acc: "#ff5a2c", acc2: "#ff4a1c" },
  light: { bg: "#f3f1eb", ink: "#131316", acc: "#e8430f", acc2: "#ff5a2c" },
};

/** Reads the real --bg/--ink/--acc/--acc-2 custom properties from globals.css
 * for both realms (dark = :root default, light = [data-realm="light"]),
 * rather than hardcoding a second set of hex values. */
function useRealmColors(): RealmColors {
  const [colors, setColors] = useState<RealmColors>(FALLBACK_COLORS);

  useEffect(() => {
    const read = (style: CSSStyleDeclaration, name: string, fallback: string) => {
      const v = style.getPropertyValue(name).trim();
      return v || fallback;
    };

    const darkStyle = getComputedStyle(document.documentElement);

    const probe = document.createElement("div");
    probe.setAttribute("data-realm", "light");
    probe.style.position = "absolute";
    probe.style.opacity = "0";
    probe.style.pointerEvents = "none";
    probe.style.width = "0";
    probe.style.height = "0";
    document.body.appendChild(probe);
    const lightStyle = getComputedStyle(probe);

    setColors({
      dark: {
        bg: read(darkStyle, "--bg", FALLBACK_COLORS.dark.bg),
        ink: read(darkStyle, "--ink", FALLBACK_COLORS.dark.ink),
        acc: read(darkStyle, "--acc", FALLBACK_COLORS.dark.acc),
        acc2: read(darkStyle, "--acc-2", FALLBACK_COLORS.dark.acc2),
      },
      light: {
        bg: read(lightStyle, "--bg", FALLBACK_COLORS.light.bg),
        ink: read(lightStyle, "--ink", FALLBACK_COLORS.light.ink),
        acc: read(lightStyle, "--acc", FALLBACK_COLORS.light.acc),
        acc2: read(lightStyle, "--acc-2", FALLBACK_COLORS.light.acc2),
      },
    });

    document.body.removeChild(probe);
  }, []);

  return colors;
}

function useIsNarrow(breakpointPx: number) {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpointPx}px)`);
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [breakpointPx]);
  return narrow;
}

type ShardDef = {
  pos: THREE.Vector3;
  rot: THREE.Euler;
  spin: number;
  driftPhase: number;
  restScale: number;
  fullScale: number;
  threshold: number;
  useAlt: boolean;
};

function buildShardDefs(
  count: number,
  reserveCount: number,
  spread: readonly [readonly [number, number], readonly [number, number], readonly [number, number]],
  hasAlt: boolean
): ShardDef[] {
  const total = count + reserveCount;
  const [xr, yr, zr] = spread;
  return Array.from({ length: total }, (_, i) => {
    const isReserve = i >= count;
    return {
      pos: new THREE.Vector3(
        THREE.MathUtils.randFloat(xr[0], xr[1]),
        THREE.MathUtils.randFloat(yr[0], yr[1]),
        THREE.MathUtils.randFloat(zr[0], zr[1])
      ),
      rot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
      spin: THREE.MathUtils.randFloat(0.05, 0.18) * (Math.random() > 0.5 ? 1 : -1),
      driftPhase: Math.random() * Math.PI * 2,
      restScale: isReserve ? 0.02 : THREE.MathUtils.randFloat(0.55, 0.85),
      fullScale: THREE.MathUtils.randFloat(0.85, 1.3),
      threshold: isReserve ? THREE.MathUtils.randFloat(0.4, 0.85) : 0,
      useAlt: hasAlt ? Math.random() > 0.5 : false,
    };
  });
}

function ShardField({
  anchor,
  rotationY,
  tint,
  tint2,
  phase,
  getIntensity,
  spread,
  count,
  reserveCount,
}: {
  anchor: [number, number, number];
  rotationY: number;
  tint: string;
  tint2?: string;
  phase: number;
  getIntensity: () => number;
  spread: readonly [readonly [number, number], readonly [number, number], readonly [number, number]];
  count: number;
  reserveCount: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const instanceRefs = useRef<(THREE.Group | null)[]>([]);

  const geometry = useMemo(() => {
    const g = new THREE.TetrahedronGeometry(0.16, 0);
    g.scale(1, 0.55, 1);
    return g;
  }, []);

  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(tint),
        transmission: 0.55,
        thickness: 0.6,
        roughness: 0.22,
        metalness: 0,
        ior: 1.35,
        iridescence: 0.4,
        iridescenceIOR: 1.2,
        iridescenceThicknessRange: [100, 400],
        transparent: true,
        opacity: 0.92,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    [tint]
  );

  const defs = useMemo(
    () => buildShardDefs(count, reserveCount, spread, Boolean(tint2)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count, reserveCount, tint2]
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const intensity = getIntensity();

    if (groupRef.current) {
      const breathe = 1 + 0.028 * Math.sin(t * 0.55 + phase);
      groupRef.current.scale.setScalar(breathe);
    }

    instanceRefs.current.forEach((obj, i) => {
      if (!obj) return;
      const d = defs[i];
      const growFactor =
        d.threshold > 0
          ? THREE.MathUtils.smoothstep(intensity, Math.max(0, d.threshold - 0.15), Math.min(1, d.threshold + 0.15))
          : 0.65 + 0.35 * intensity;
      const scale = THREE.MathUtils.lerp(d.restScale, d.fullScale, growFactor);
      obj.scale.setScalar(scale);
      obj.position.set(
        d.pos.x + Math.sin(t * 0.4 + d.driftPhase) * 0.06,
        d.pos.y + Math.cos(t * 0.33 + d.driftPhase * 1.3) * 0.06,
        d.pos.z + Math.sin(t * 0.28 + d.driftPhase * 0.6) * 0.06
      );
      obj.rotation.set(d.rot.x + t * d.spin, d.rot.y + t * d.spin * 0.7, d.rot.z + t * d.spin * 0.5);
    });
  });

  return (
    <group ref={groupRef} position={anchor} rotation={[0, rotationY, 0]}>
      <Instances geometry={geometry} material={material} limit={defs.length}>
        {defs.map((d, i) => (
          <Instance
            key={i}
            ref={(el) => {
              // drei's Instance ref type is `unknown` at the type level; at
              // runtime it is always a PositionMesh, which extends THREE.Group.
              instanceRefs.current[i] = el as THREE.Group | null;
            }}
            color={d.useAlt && tint2 ? tint2 : tint}
          />
        ))}
      </Instances>
    </group>
  );
}

function RiftGlow({
  getIntensityDark,
  getIntensityLight,
  colorDark,
  colorLight,
  width,
}: {
  getIntensityDark: () => number;
  getIntensityLight: () => number;
  colorDark: string;
  colorLight: string;
  width: number;
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensityDark: { value: 0.3 },
      uIntensityLight: { value: 0.3 },
      uColorDark: { value: new THREE.Color(colorDark) },
      uColorLight: { value: new THREE.Color(colorLight) },
    }),
    // colors rarely change after mount (measured once); keep the material stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    uniforms.uColorDark.value.set(colorDark);
    uniforms.uColorLight.value.set(colorLight);
  }, [colorDark, colorLight, uniforms]);

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime;
    uniforms.uIntensityDark.value = getIntensityDark();
    uniforms.uIntensityLight.value = getIntensityLight();
  });

  return (
    <mesh position={[0, 0, -0.55]}>
      <planeGeometry args={[width, 4.6, 1, 1]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec2 vUv;
          uniform float uTime;
          uniform float uIntensityDark;
          uniform float uIntensityLight;
          uniform vec3 uColorDark;
          uniform vec3 uColorLight;

          void main() {
            vec2 c = vUv - 0.5;
            float d = length(c * vec2(2.1, 1.05));
            float core = smoothstep(0.62, 0.0, d);
            float flicker = 0.82 + 0.18 * sin(uTime * 1.4 + c.y * 3.0);
            float side = smoothstep(-0.5, 0.5, c.x);
            vec3 col = mix(uColorDark, uColorLight, side);
            float intensity = mix(uIntensityDark, uIntensityLight, side);
            float alpha = core * flicker * (0.28 + 0.72 * intensity);
            gl_FragColor = vec4(col * (0.9 + intensity * 0.7), alpha);
          }
        `}
      />
    </mesh>
  );
}

function Scene({ hoveredSide, colors }: { hoveredSide: Side | null; colors: RealmColors }) {
  const { viewport } = useThree();
  const intensityDark = useRef(0.3);
  const intensityLight = useRef(0.3);

  useFrame((_, delta) => {
    const targetDark = hoveredSide === "dark" ? 1 : 0.3;
    const targetLight = hoveredSide === "light" ? 1 : 0.3;
    intensityDark.current = THREE.MathUtils.damp(intensityDark.current, targetDark, 4, delta);
    intensityLight.current = THREE.MathUtils.damp(intensityLight.current, targetLight, 4, delta);
  });

  const anchorX = Math.max(0.55, viewport.width * 0.19);

  return (
    <>
      <ambientLight intensity={0.55} />
      <pointLight position={[-4, 3, 5]} intensity={1.1} color={colors.dark.acc} />
      <pointLight position={[4, 3, 5]} intensity={1.1} color={colors.light.acc} />
      <pointLight position={[0, 0, 4]} intensity={0.5} color="#ffffff" />

      <ShardField
        anchor={[-anchorX, 0, 0]}
        rotationY={0.42}
        tint={colors.dark.ink}
        phase={0}
        getIntensity={() => intensityDark.current}
        spread={[
          [-1.3, 0.95],
          [-1.9, 1.9],
          [-0.35, 0.35],
        ]}
        count={26}
        reserveCount={14}
      />
      <ShardField
        anchor={[anchorX, 0, 0]}
        rotationY={-0.42}
        tint={colors.light.ink}
        phase={1.7}
        getIntensity={() => intensityLight.current}
        spread={[
          [-0.95, 1.3],
          [-1.9, 1.9],
          [-0.35, 0.35],
        ]}
        count={26}
        reserveCount={14}
      />
      <ShardField
        anchor={[0, 0, -0.5]}
        rotationY={0}
        tint={colors.dark.ink}
        tint2={colors.light.ink}
        phase={3.1}
        getIntensity={() => Math.max(intensityDark.current, intensityLight.current)}
        spread={[
          [-0.85, 0.85],
          [-1.7, 1.7],
          [-0.4, 0.4],
        ]}
        count={22}
        reserveCount={10}
      />

      <RiftGlow
        getIntensityDark={() => intensityDark.current}
        getIntensityLight={() => intensityLight.current}
        colorDark={colors.dark.acc}
        colorLight={colors.light.acc}
        width={Math.max(1.1, anchorX * 0.95)}
      />
    </>
  );
}

function RealmCard({
  side,
  label,
  hovered,
  picked,
  onEnter,
  onLeave,
  onPick,
  tiltDeg,
}: {
  side: Side;
  label: string;
  hovered: boolean;
  picked: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onPick: () => void;
  tiltDeg: number;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Enter ${label}`}
      aria-pressed={picked}
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
      data-realm={side === "light" ? "light" : undefined}
      className="group relative w-full max-w-[420px] sm:w-[38vw] cursor-pointer outline-none"
      style={{
        transform: `rotateY(${tiltDeg}deg)`,
        transformStyle: "preserve-3d",
        transition: "transform 0.6s cubic-bezier(.22,.7,.16,1)",
      }}
    >
      <div
        className="relative overflow-hidden border transition-[backdrop-filter,box-shadow,transform] duration-500"
        style={{
          background: "color-mix(in srgb, var(--bg) 55%, transparent)",
          borderColor: "var(--ln)",
          backdropFilter: `blur(${hovered ? 26 : 14}px) saturate(150%)`,
          WebkitBackdropFilter: `blur(${hovered ? 26 : 14}px) saturate(150%)`,
          clipPath:
            side === "dark"
              ? "polygon(0 0, 100% 0, 100% 100%, 8% 100%, 0 88%)"
              : "polygon(0 0, 92% 0, 100% 12%, 100% 100%, 0 100%)",
          boxShadow: hovered ? "0 30px 80px rgba(0,0,0,0.35)" : "0 14px 40px rgba(0,0,0,0.18)",
          transform: hovered ? "scale(1.03)" : "scale(1)",
        }}
      >
        <div className="px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.24em] uppercase text-mut">
            <span>{label}</span>
            <span className="text-acc">{picked ? "✓ set" : hovered ? "release to enter" : "hover"}</span>
          </div>

          <div
            className="mt-8 rounded-[2px] border transition-all duration-500"
            style={{
              borderColor: "var(--ln)",
              background: "var(--bg)",
              opacity: hovered ? 1 : 0.45,
              filter: hovered ? "blur(0px)" : "blur(1.5px)",
              transform: hovered ? "scale(1)" : "scale(0.96)",
            }}
          >
            <div className="flex items-center justify-between px-3 pt-3">
              <span className="font-display text-[11px] font-medium text-ink">tariwei</span>
              <div className="flex gap-1">
                <span className="h-[3px] w-3 rounded-full" style={{ background: "var(--ln)" }} />
                <span className="h-[3px] w-3 rounded-full" style={{ background: "var(--ln)" }} />
                <span className="h-[3px] w-3 rounded-full" style={{ background: "var(--acc)" }} />
              </div>
            </div>
            <div className="px-3 pb-4 pt-5">
              <p className="font-display text-[20px] sm:text-[24px] leading-[1] tracking-tight text-ink">
                From the metal
                <br />
                to the <span className="font-accent italic text-acc">pixel.</span>
              </p>
              <div className="mt-3 flex gap-1.5">
                <span className="h-1.5 flex-[2] rounded-full" style={{ background: "var(--ln)" }} />
                <span className="h-1.5 flex-1 rounded-full" style={{ background: "var(--acc)" }} />
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between font-mono text-[10px] tracking-[0.2em] text-mut uppercase">
            <span>{side === "dark" ? "near-black · warm ink" : "warm white · deep ink"}</span>
            <span className="text-ink">enter →</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RealmSelect() {
  const colors = useRealmColors();
  const [hoveredSide, setHoveredSide] = useState<Side | null>(null);
  const [pickedSide, setPickedSide] = useState<Side | null>(null);
  const isNarrow = useIsNarrow(640);

  const handlePick = useCallback((side: Side) => {
    setPickedSide(side);
    useSiteStore.getState().setRealm(side);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-bg text-ink select-none">
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 0, 7.5], fov: 42 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
          style={{ width: "100%", height: "100%", display: "block" }}
        >
          <Scene hoveredSide={hoveredSide} colors={colors} />
        </Canvas>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-[7%] sm:top-[9%] z-20 flex flex-col items-center gap-3 px-4 text-center">
        <Logo className="mb-1 h-5 w-auto text-ink/60" />
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-mut">
          Two renders. One site.
        </span>
        <h1 className="font-display text-[clamp(2rem,6vw,4.2rem)] leading-[0.95] tracking-tight text-ink">
          Choose Your <span className="font-accent italic text-acc">Realm</span>
        </h1>
      </div>

      <div className="absolute inset-x-0 bottom-[6%] z-10 flex flex-col items-center justify-center gap-8 px-4 sm:bottom-[9%] sm:flex-row sm:gap-[6vw]">
        <RealmCard
          side="dark"
          label="Dark Realm"
          hovered={hoveredSide === "dark"}
          picked={pickedSide === "dark"}
          onEnter={() => setHoveredSide("dark")}
          onLeave={() => setHoveredSide((s) => (s === "dark" ? null : s))}
          onPick={() => handlePick("dark")}
          tiltDeg={isNarrow ? 0 : 20}
        />
        <RealmCard
          side="light"
          label="Light Realm"
          hovered={hoveredSide === "light"}
          picked={pickedSide === "light"}
          onEnter={() => setHoveredSide("light")}
          onLeave={() => setHoveredSide((s) => (s === "light" ? null : s))}
          onPick={() => handlePick("light")}
          tiltDeg={isNarrow ? 0 : -20}
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-center">
        <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-mut/70">
          hover to inspect · click to enter
        </span>
      </div>
    </div>
  );
}
