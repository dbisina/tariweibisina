import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

const bg = (accent: string) =>
  `radial-gradient(1200px 800px at 30% 20%, ${accent}22, transparent 60%), radial-gradient(1000px 700px at 80% 90%, ${accent}14, transparent 55%), #0b0b0c`;

export const IntroCard: React.FC<{ title: string; subtitle: string; accent: string }> = ({
  title,
  subtitle,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200 } });
  const up = interpolate(enter, [0, 1], [46, 0]);
  const subOpacity = interpolate(frame, [0.4 * fps, 1.0 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const line = interpolate(frame, [0.2 * fps, 1.1 * fps], [0, 148], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: bg(accent), alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", transform: `translateY(${up}px)`, opacity: enter }}>
        <div style={{ width: line, height: 4, background: accent, margin: "0 auto 34px", borderRadius: 2 }} />
        <div
          style={{
            fontFamily: "Rubik, sans-serif",
            fontWeight: 800,
            fontSize: 118,
            letterSpacing: "-0.02em",
            color: "#f4f3ef",
            lineHeight: 1,
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 26,
            fontFamily: "ui-monospace, monospace",
            fontSize: 26,
            letterSpacing: "0.24em",
            color: "#8b8a84",
            textTransform: "uppercase",
            opacity: subOpacity,
          }}
        >
          {subtitle}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const OutroCard: React.FC<{ url: string; line: string; accent: string }> = ({ url, line, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill style={{ background: bg(accent), alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", opacity: enter, transform: `scale(${interpolate(enter, [0, 1], [0.94, 1])})` }}>
        <div
          style={{
            fontFamily: "Rubik, sans-serif",
            fontWeight: 700,
            fontSize: 66,
            color: "#f4f3ef",
          }}
        >
          {url}
        </div>
        <div
          style={{
            marginTop: 22,
            fontFamily: "ui-monospace, monospace",
            fontSize: 21,
            letterSpacing: "0.2em",
            color: accent,
            textTransform: "uppercase",
          }}
        >
          {line}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Bottom-left caption pill for page scenes. */
export const Caption: React.FC<{ text: string; accent: string }> = ({ text, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - 0.25 * fps, fps, config: { damping: 200 } });

  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        bottom: 52,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "16px 26px",
        borderRadius: 999,
        background: "rgba(11,11,12,0.82)",
        border: "1px solid rgba(255,255,255,0.14)",
        backdropFilter: "blur(10px)",
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [22, 0])}px)`,
      }}
    >
      <span style={{ width: 9, height: 9, borderRadius: "50%", background: accent }} />
      <span style={{ fontFamily: "Rubik, sans-serif", fontSize: 25, color: "#f4f3ef" }}>{text}</span>
    </div>
  );
};
