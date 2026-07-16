import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import type { CursorWaypoint } from "../types";

/**
 * Animated macOS-style cursor. Position eases between waypoints; a `click`
 * waypoint spawns an expanding ripple and a quick press-scale on arrival.
 * Coordinates are normalized to the viewport box this is rendered inside
 * (position: absolute, so wrap in a relatively-positioned container).
 */
export const Cursor: React.FC<{
  waypoints: CursorWaypoint[];
  width: number;
  height: number;
}> = ({ waypoints, width, height }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tSec = frame / fps;

  if (!waypoints.length) return null;

  const times = waypoints.map((w) => w.t);
  const x = interpolate(tSec, times, waypoints.map((w) => w.x * width), {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.35, 0, 0.25, 1),
  });
  const y = interpolate(tSec, times, waypoints.map((w) => w.y * height), {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.35, 0, 0.25, 1),
  });

  // press-scale + ripples around click waypoints
  let scale = 1;
  const ripples: { age: number; cx: number; cy: number }[] = [];
  for (const w of waypoints) {
    if (!w.click) continue;
    const age = tSec - w.t;
    if (age >= -0.12 && age < 0.14) scale = 0.82;
    if (age >= 0 && age < 0.8) ripples.push({ age, cx: w.x * width, cy: w.y * height });
  }

  return (
    <>
      {ripples.map((r, i) => {
        const size = interpolate(r.age, [0, 0.8], [18, 110]);
        const opacity = interpolate(r.age, [0, 0.8], [0.55, 0]);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: r.cx - size / 2,
              top: r.cy - size / 2,
              width: size,
              height: size,
              borderRadius: "50%",
              border: "3px solid rgba(255,255,255,0.9)",
              boxShadow: "0 0 18px rgba(0,0,0,0.35)",
              opacity,
              pointerEvents: "none",
            }}
          />
        );
      })}
      <svg
        width={34}
        height={44}
        viewBox="0 0 28 36"
        style={{
          position: "absolute",
          left: x,
          top: y,
          transform: `scale(${scale})`,
          transformOrigin: "6px 4px",
          filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.45))",
          pointerEvents: "none",
        }}
      >
        <path
          d="M5 2 L5 26 L11 20.5 L15 30 L19.5 28 L15.5 19 L23 18.5 Z"
          fill="#ffffff"
          stroke="#111114"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    </>
  );
};
