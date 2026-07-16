import type { NextConfig } from "next";
import path from "path";

/**
 * `output: "standalone"` — Railway/Nixpacks builds a self-contained
 * .next/standalone bundle instead of shipping full node_modules, which is
 * both the recommended and the faster/leaner path for a containerized
 * deploy.
 *
 * `serverExternalPackages: ["@prisma/client"]` — Prisma's generated client
 * ships a native query-engine binary that Next's file tracer doesn't always
 * follow correctly through a bundled import; marking it external tells Next
 * to require it from real node_modules at runtime instead of bundling it,
 * which is Prisma's own documented fix for standalone-output deploys.
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
  serverExternalPackages: ["@prisma/client"],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "picsum.photos" }],
  },
  experimental: {
    // Next 16 caps request bodies through the proxy at 10MB by default,
    // which broke Studio media uploads (walkthrough videos run 20MB+;
    // /api/upload itself allows 100MB and streams to Cloudinary).
    proxyClientMaxBodySize: "110mb",
  },
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
