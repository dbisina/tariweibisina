import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/seo";
import { OWNER } from "@/lib/ai/knowledge";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${OWNER.name} — ${SITE_NAME}`,
    short_name: SITE_NAME,
    description: `${OWNER.role} portfolio — ${OWNER.company}.`,
    start_url: "/",
    display: "standalone",
    background_color: "#0b0b0c",
    theme_color: "#0b0b0c",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
    ],
  };
}
