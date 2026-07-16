import React from "react";

/** Minimal, elegant browser chrome around the site viewport — traffic
 * lights + URL pill. Children render inside the clipped viewport. */
export const CHROME_H = 52;

export const BrowserFrame: React.FC<{
  url: string;
  width: number;
  height: number;
  accent: string;
  children: React.ReactNode;
}> = ({ url, width, height, accent, children }) => {
  return (
    <div
      style={{
        width,
        height: height + CHROME_H,
        borderRadius: 18,
        overflow: "hidden",
        background: "#101013",
        boxShadow: "0 44px 120px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.09)",
      }}
    >
      <div
        style={{
          height: CHROME_H,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 20px",
          background: "linear-gradient(#1b1b1f, #141417)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <span style={{ width: 13, height: 13, borderRadius: "50%", background: "#ff5f57" }} />
        <span style={{ width: 13, height: 13, borderRadius: "50%", background: "#febc2e" }} />
        <span style={{ width: 13, height: 13, borderRadius: "50%", background: "#28c840" }} />
        <div
          style={{
            marginLeft: 18,
            flex: 1,
            maxWidth: 620,
            height: 30,
            borderRadius: 15,
            background: "rgba(255,255,255,0.07)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 14px",
            fontFamily: "ui-monospace, monospace",
            fontSize: 14,
            color: "rgba(255,255,255,0.75)",
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: accent }} />
          {url}
        </div>
      </div>
      <div style={{ position: "relative", width, height, overflow: "hidden", background: "#0b0b0c" }}>
        {children}
      </div>
    </div>
  );
};
