import { ImageResponse } from "next/og";
import { OWNER } from "@/lib/ai/knowledge";

export const alt = `${OWNER.name} — ${OWNER.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default share card for every route that doesn't define its own
 * opengraph-image — matches the about-hero treatment (outlined name line,
 * huge solid "TARIWEI." in the accent color). */
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "90px 96px",
          background: "#0b0b0c",
          color: "#f4f3ef",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 20, letterSpacing: "6px", color: "#ff5a2c" }}>
          <span style={{ width: 9, height: 9, borderRadius: 999, background: "#ff5a2c", display: "flex" }} />
          <span>TARIWEI</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 36 }}>
          <span style={{ fontSize: 26, letterSpacing: "3px", color: "#8b8a84" }}>
            POLYGLOT SOFTWARE &amp; AI SYSTEMS ENGINEER
          </span>
          <span style={{ fontSize: 58, fontWeight: 600, marginTop: 22, color: "#f4f3ef" }}>
            BISINA, DANIEL
          </span>
          <span style={{ fontSize: 150, fontWeight: 800, marginTop: 4, color: "#ff5a2c", letterSpacing: "-4px" }}>
            TARIWEI.
          </span>
        </div>
        <div style={{ display: "flex", marginTop: 30, fontSize: 22, color: "#8b8a84", letterSpacing: "2px" }}>
          GPU KERNELS · AI-NATIVE OS · PRODUCTION WEB &amp; MOBILE
        </div>
      </div>
    ),
    { ...size }
  );
}
