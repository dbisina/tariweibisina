import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iOS "Add to Home Screen" icon — square, matches icon.tsx's mark at a
 * larger canvas so the glyph has room to breathe. */
export default function AppleIcon() {
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
          fontSize: 120,
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
