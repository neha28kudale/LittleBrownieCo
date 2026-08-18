import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getProducts } from "@/lib/products";

const BASE_URL = "";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const products = await getProducts();
        const entries = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/menu", changefreq: "weekly", priority: "0.9" },
          { path: "/about", changefreq: "monthly", priority: "0.7" },
          { path: "/faqs", changefreq: "monthly", priority: "0.7" },
          { path: "/contact", changefreq: "monthly", priority: "0.7" },
          { path: "/good-to-know", changefreq: "monthly", priority: "0.7" },
          { path: "/policies", changefreq: "monthly", priority: "0.6" },
          { path: "/gifts", changefreq: "monthly", priority: "0.5" },
          ...products.map((p) => ({
            path: `/product/${p.slug}`,
            changefreq: "monthly",
            priority: "0.7",
          })),
        ];
        const urls = entries.map(
          (e) =>
            `  <url>\n    <loc>${BASE_URL}${e.path}</loc>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`,
        );
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
