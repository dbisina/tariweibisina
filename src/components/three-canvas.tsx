"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createRoot, events, extend, type ReconcilerRoot } from "@react-three/fiber";

// Stock <Canvas> registers the THREE namespace with the reconciler on mount;
// a manual createRoot must do it explicitly or every <mesh>/<group> throws.
// (Runtime accepts the namespace object — the public typings don't.)
extend(THREE as unknown as Parameters<typeof extend>[0]);

/**
 * Drop-in replacement for @react-three/fiber's <Canvas>.
 *
 * Stock <Canvas> measures its container with react-use-measure
 * (ResizeObserver). In some embedded webviews that observer never fires, so
 * the R3F root never configures and children never mount (canvas stays at
 * the intrinsic 300x150). This version measures with rAF-polled
 * getBoundingClientRect (which always works) and passes the size to the R3F
 * root explicitly.
 */
export function ThreeCanvas({
  children,
  camera,
  dpr = [1, 2],
  className,
  style,
}: {
  children: React.ReactNode;
  camera?: { position?: [number, number, number]; fov?: number };
  dpr?: [number, number];
  className?: string;
  style?: React.CSSProperties;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<ReconcilerRoot<HTMLCanvasElement> | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    let raf: number;
    let frames = 0;
    const read = () => {
      const r = el.getBoundingClientRect();
      setSize((s) => (Math.abs(s.w - r.width) > 1 || Math.abs(s.h - r.height) > 1 ? { w: r.width, h: r.height } : s));
      // poll every frame for the first second (layout settling), then via
      // the interval below
      frames += 1;
      if (frames < 60) raf = requestAnimationFrame(read);
    };
    raf = requestAnimationFrame(read);
    const interval = window.setInterval(read, 600);
    window.addEventListener("resize", read);
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(interval);
      window.removeEventListener("resize", read);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.w <= 0 || size.h <= 0) return;

    if (!rootRef.current) {
      rootRef.current = createRoot(canvas);
    }
    rootRef.current.configure({
      events,
      size: { width: size.w, height: size.h, top: 0, left: 0 },
      dpr,
      gl: { antialias: true, alpha: true },
      camera: { position: camera?.position ?? [0, 0, 5], fov: camera?.fov ?? 50 },
      onCreated: (state) => {
        state.gl.setClearColor(new THREE.Color(0x000000), 0);
      },
    });
    rootRef.current.render(<>{children}</>);
  });

  useEffect(() => {
    return () => {
      rootRef.current?.unmount();
      rootRef.current = null;
    };
  }, []);

  return (
    <div ref={wrapperRef} className={className} style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", ...style }}>
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  );
}
