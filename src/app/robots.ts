import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/** /studio is the owner's CMS admin panel, not public content — keep it out
 * of the index. Everything else is crawlable. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/studio", "/studio/", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
