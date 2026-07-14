import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Browser-tab favicon — a bold accent "T" on the dark brand background.
 * icon.png previously shipped here was the 918×98 wordmark banner squished
 * into a square slot; a single glyph is what actually reads at 32px. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0b0c",
          color: "#ff5a2c",
          fontSize: 24,
          fontWeight: 800,
          fontFamily: "sans-serif",
        }}
      >
        T
      </div>
    ),
    { ...size }
  );
}
