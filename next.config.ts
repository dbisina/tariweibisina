import type { NextConfig } from "next";
import path from "path";

/**
 * `output: "standalone"` — Railway/Nixpacks builds a self-contained
 * .next/standalone bundle instead of shipping full node_modules, which is
 * both the recommended and the faster/leaner path for a containerized
 * deploy. (Requires db.ts's `pg` import to be a static literal, not a
 * webpackIgnore'd variable specifier, so Next's file-tracer actually
 * bundles it — see db.ts.)
 *
 * headers() are deploy-wide hardening, chosen not to break anything already
 * built here: Permissions-Policy allows camera/mic to `self` only (Rimuru's
 * Live mode needs both), and the CSP is deliberately narrow — frame-ancestors
 * + object-src only, so it can't clash with the site's inline styles,
 * three.js/gsap, or Google Fonts.
 */
const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  turbopack: {
    root: path.resolve(__dirname),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self';" },
        ],
      },
    ];
  },
};

export default nextConfig;
